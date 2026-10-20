import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { canReviewSubmissions } from '../utils/permissions';

/**
 * Format file size in KB or MB
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Read File as Base64 Data URL (for fallback preview and resilient storage)
 */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function useWorkSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { userProfile } = useAuth();
  const isReviewer = canReviewSubmissions(userProfile);

  // Listen to Firestore submissions
  useEffect(() => {
    if (!userProfile) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const submissionsRef = collection(db, 'workSubmissions');

    const unsubscribe = onSnapshot(submissionsRef, (snapshot) => {
      let list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Sort newest first
      list.sort((a, b) => {
        const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
        const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
        return timeB - timeA;
      });

      // Role filtering: Employee only sees own submissions; Reviewer (Founder/Admin) sees all
      if (!isReviewer) {
        const myUid = userProfile.uid;
        const myEmail = userProfile.email?.toLowerCase();
        list = list.filter(s =>
          s.employeeUid === myUid ||
          s.employeeEmail?.toLowerCase() === myEmail
        );
      }

      setSubmissions(list);
      setLoading(false);
    }, (error) => {
      console.warn('Error fetching work submissions:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [userProfile, isReviewer]);

  // Log activity helper
  const logActivity = useCallback(async (action, details = {}) => {
    try {
      await addDoc(collection(db, 'activity_log'), {
        action,
        actorUid: userProfile?.uid || 'unknown',
        actorName: userProfile?.displayName || userProfile?.email || 'User',
        actorEmail: userProfile?.email || '',
        actorRole: userProfile?.role || 'employee',
        timestamp: serverTimestamp(),
        ...details,
      });
    } catch (err) {
      console.warn('Could not write to activity log:', err);
    }
  }, [userProfile]);

  // Upload PDF file to Firebase Storage with resilient DataURL fallback
  const uploadPdfFile = useCallback(async (file, submissionId, versionNumber = 1) => {
    if (!file) throw new Error('No file provided');
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Accepted format is PDF only');
    }

    // Convert to DataURL for immediate preview & offline fallback
    let dataUrl = null;
    try {
      dataUrl = await readFileAsDataURL(file);
    } catch (e) {
      console.warn('Could not read file as DataURL:', e);
    }

    const storagePath = `work-submissions/${userProfile.uid}/${submissionId}/version-${versionNumber}_${file.name}`;
    let downloadUrl = dataUrl;

    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.round(progress));
          },
          (error) => {
            console.warn('Firebase Storage upload error, falling back to data URL:', error);
            // Don't reject if we have dataUrl fallback
            if (dataUrl) {
              resolve(dataUrl);
            } else {
              reject(error);
            }
          },
          async () => {
            try {
              downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadUrl);
            } catch (err) {
              resolve(dataUrl);
            }
          }
        );
      });
    } catch (err) {
      console.warn('Storage upload failed, using Data URL fallback:', err);
      downloadUrl = dataUrl;
    }

    return {
      storagePath,
      fileUrl: downloadUrl || dataUrl,
      fileName: file.name,
      fileSize: file.size,
    };
  }, [userProfile]);

  // Create a new work submission
  const createSubmission = useCallback(async ({ title, description, taskId, taskTitle, pdfFile, isDraft = false }) => {
    if (!userProfile) throw new Error('Not authenticated');
    if (!title?.trim()) throw new Error('Submission title is required');
    if (!pdfFile && !isDraft) throw new Error('PDF file is required');

    setUploadProgress(10);
    const tempId = 'sub_' + Date.now();
    let fileMeta = {
      storagePath: '',
      fileUrl: '',
      fileName: '',
      fileSize: 0,
    };

    if (pdfFile) {
      fileMeta = await uploadPdfFile(pdfFile, tempId, 1);
    }

    setUploadProgress(90);

    const initialStatus = isDraft ? 'draft' : 'submitted';

    const newSubmission = {
      employeeUid: userProfile.uid,
      employeeName: userProfile.displayName || userProfile.email?.split('@')[0] || 'Employee',
      employeeEmail: userProfile.email?.toLowerCase() || '',
      title: title.trim(),
      description: description?.trim() || '',
      taskId: taskId || null,
      taskTitle: taskTitle || '',
      fileName: fileMeta.fileName,
      fileSize: fileMeta.fileSize,
      fileUrl: fileMeta.fileUrl,
      storagePath: fileMeta.storagePath,
      versionNumber: 1,
      status: initialStatus, // 'draft' | 'submitted' | 'under_review' | 'changes_requested' | 'approved'
      submittedAt: isDraft ? null : serverTimestamp(),
      reviewedBy: null,
      reviewedByEmail: null,
      reviewedAt: null,
      reviewComment: '',
      versionHistory: fileMeta.fileName ? [
        {
          version: 1,
          fileName: fileMeta.fileName,
          fileSize: fileMeta.fileSize,
          fileUrl: fileMeta.fileUrl,
          submittedAt: new Date().toISOString(),
          note: 'Initial submission',
        }
      ] : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'workSubmissions'), newSubmission);

    // Update task indicator if linked
    if (taskId) {
      try {
        await updateDoc(doc(db, 'tasks', taskId), {
          hasSubmission: true,
          submissionId: docRef.id,
          submissionStatus: initialStatus,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Could not link submission flag to task:', e);
      }
    }

    // Log event
    await logActivity(isDraft ? 'Work submission draft saved' : 'Work submission created', {
      submissionId: docRef.id,
      submissionTitle: title.trim(),
      fileName: fileMeta.fileName,
      taskId: taskId || null,
    });

    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 1000);
    return docRef.id;
  }, [userProfile, uploadPdfFile, logActivity]);

  // Submit a revised PDF for an existing submission
  const submitRevision = useCallback(async (submissionId, { pdfFile, revisionNote }) => {
    if (!userProfile) throw new Error('Not authenticated');
    if (!pdfFile) throw new Error('Please select a revised PDF file');

    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) throw new Error('Submission not found');

    const nextVersion = (sub.versionNumber || 1) + 1;
    setUploadProgress(10);

    const fileMeta = await uploadPdfFile(pdfFile, submissionId, nextVersion);
    setUploadProgress(85);

    const newHistoryItem = {
      version: nextVersion,
      fileName: fileMeta.fileName,
      fileSize: fileMeta.fileSize,
      fileUrl: fileMeta.fileUrl,
      submittedAt: new Date().toISOString(),
      note: revisionNote || `Revised version ${nextVersion}`,
    };

    const history = Array.isArray(sub.versionHistory) ? [...sub.versionHistory, newHistoryItem] : [newHistoryItem];

    const submissionRef = doc(db, 'workSubmissions', submissionId);
    await updateDoc(submissionRef, {
      fileName: fileMeta.fileName,
      fileSize: fileMeta.fileSize,
      fileUrl: fileMeta.fileUrl,
      storagePath: fileMeta.storagePath,
      versionNumber: nextVersion,
      status: 'submitted', // Reset to awaiting review
      submittedAt: serverTimestamp(),
      versionHistory: history,
      updatedAt: serverTimestamp(),
    });

    // Update task indicator if linked
    if (sub.taskId) {
      try {
        await updateDoc(doc(db, 'tasks', sub.taskId), {
          submissionStatus: 'submitted',
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Could not update task submission status:', e);
      }
    }

    // Audit log
    await logActivity('Revised PDF submitted', {
      submissionId,
      submissionTitle: sub.title,
      fileName: fileMeta.fileName,
      version: nextVersion,
      note: revisionNote,
    });

    setUploadProgress(100);
    setTimeout(() => setUploadProgress(0), 1000);
  }, [userProfile, submissions, uploadPdfFile, logActivity]);

  // Founder and Admin review workflow: Mark Under Review, Approve, Request Changes
  const reviewSubmission = useCallback(async (submissionId, { action, reviewComment }) => {
    if (!isReviewer) throw new Error('Unauthorized: only founder and admins can review submissions');

    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) throw new Error('Submission not found');

    if (action === 'changes_requested' && !reviewComment?.trim()) {
      throw new Error('A feedback message is required when requesting changes');
    }

    let newStatus = 'under_review';
    let logActionName = 'Submission marked Under Review';

    if (action === 'approved') {
      newStatus = 'approved';
      logActionName = 'Submission approved';
    } else if (action === 'changes_requested') {
      newStatus = 'changes_requested';
      logActionName = 'Changes requested';
    }

    const submissionRef = doc(db, 'workSubmissions', submissionId);
    await updateDoc(submissionRef, {
      status: newStatus,
      reviewedBy: userProfile.displayName || userProfile.email?.split('@')[0] || 'Admin',
      reviewedByEmail: userProfile.email || '',
      reviewedAt: serverTimestamp(),
      reviewComment: reviewComment?.trim() || '',
      updatedAt: serverTimestamp(),
    });

    // Update task indicator if linked
    if (sub.taskId) {
      try {
        await updateDoc(doc(db, 'tasks', sub.taskId), {
          submissionStatus: newStatus,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Could not update task submission status:', e);
      }
    }

    // Audit log
    await logActivity(logActionName, {
      submissionId,
      submissionTitle: sub.title,
      reviewComment: reviewComment?.trim() || '',
      status: newStatus,
    });
  }, [isReviewer, userProfile, submissions, logActivity]);

  // Delete submission (drafts or admin)
  const deleteSubmission = useCallback(async (submissionId) => {
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) return;

    if (!isReviewer && sub.status !== 'draft') {
      throw new Error('Only draft submissions can be deleted');
    }

    await deleteDoc(doc(db, 'workSubmissions', submissionId));

    if (sub.taskId) {
      try {
        await updateDoc(doc(db, 'tasks', sub.taskId), {
          hasSubmission: false,
          submissionId: null,
          submissionStatus: null,
        });
      } catch (e) {
        console.warn('Could not reset task submission status:', e);
      }
    }

    await logActivity('Submission deleted', {
      submissionId,
      submissionTitle: sub.title,
    });
  }, [isReviewer, submissions, logActivity]);

  // Notification badges
  const awaitingCount = submissions.filter(s => s.status === 'submitted').length;
  const changesRequestedCount = submissions.filter(s => s.status === 'changes_requested').length;

  return {
    submissions,
    loading,
    uploadProgress,
    createSubmission,
    submitRevision,
    reviewSubmission,
    deleteSubmission,
    awaitingCount,
    changesRequestedCount,
  };
}
