import { useEffect, useRef, useState } from 'react';
import { deleteLearningMaterial, fetchLearningMaterials, uploadLearningMaterial } from '../../lib/supabaseClient';
import { formatTimestamp } from './teacherUtils';
import { DownloadIcon, FileIconByType, TrashIcon } from './TeacherIcons';
import useConfirm from './useConfirm';

const ACCEPTED_EXTENSIONS = '.ppt,.pptx,.pdf,.mp4,.mp3';

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) {
    return '';
  }
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function TeacherLearningMaterials({ backendUserId, classes, loading }) {
  const [confirmDialog, confirm] = useConfirm();
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const loadMaterials = async (classId) => {
    setMaterialsLoading(true);
    setError(null);
    const result = await fetchLearningMaterials(classId);
    if (result.error) {
      setError(result.error.message || 'Failed to load learning materials');
    } else {
      setMaterials(Array.isArray(result.data) ? result.data : []);
    }
    setMaterialsLoading(false);
  };

  useEffect(() => {
    if (selectedClassId) {
      void loadMaterials(selectedClassId);
    }
  }, [selectedClassId]);

  const handleUpload = async (event) => {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Choose a PPT, PDF, MP4, or MP3 file to upload.');
      return;
    }

    if (!selectedClassId || !backendUserId) {
      setError('Select a class before uploading.');
      return;
    }

    setUploading(true);
    setError(null);
    const result = await uploadLearningMaterial(selectedClassId, backendUserId, file, title.trim());
    setUploading(false);

    if (result.error) {
      setError(result.error.message || 'Failed to upload material');
      return;
    }

    setTitle('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    await loadMaterials(selectedClassId);
  };

  const handleDelete = async (materialId) => {
    if (!backendUserId) {
      return;
    }
    const confirmed = await confirm('Students will no longer be able to view or download this file.', {
      title: 'Delete this material?',
      confirmLabel: 'Delete Material',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }

    const result = await deleteLearningMaterial(materialId, backendUserId);
    if (!result.error) {
      await loadMaterials(selectedClassId);
    }
  };

  if (!loading && classes.length === 0) {
    return (
      <section className="teacher-board" aria-label="Learning materials">
        <p className="teacher-empty">Create a class first from the Dashboard, then come back here to share PPT, PDF, MP4, or MP3 files with its students.</p>
      </section>
    );
  }

  return (
    <section aria-label="Learning materials">
      {confirmDialog}
      <div className="teacher-class-picker" role="group" aria-label="Select class">
        {classes.map((classItem) => (
          <button
            key={classItem.id}
            type="button"
            className={selectedClassId === classItem.id ? 'active' : ''}
            onClick={() => setSelectedClassId(classItem.id)}
          >
            {classItem.name}
          </button>
        ))}
      </div>

      <div className="teacher-activities-layout">
        <div className="teacher-activity-editor">
          <div className="teacher-board-head">
            <h3>Upload Material</h3>
            <p>Accepted formats: PPT, PDF, MP4, MP3</p>
          </div>

          <form onSubmit={handleUpload}>
            <label className="teacher-activity-field">
              <span>Title (optional)</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Week 3 - Vowel Sounds" />
            </label>

            <label className="teacher-activity-field">
              <span>File</span>
              <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS} />
            </label>

            {error && <div className="teacher-error">{error}</div>}

            <button type="submit" className="teacher-primary-button teacher-create-activity" disabled={uploading || !selectedClassId}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>

        <div className="teacher-activity-list-panel">
          <div className="teacher-board-head">
            <h3>Materials</h3>
            <p>{materialsLoading ? 'Loading...' : `${materials.length} file${materials.length === 1 ? '' : 's'} shared with this class`}</p>
          </div>

          <div className="teacher-materials-list">
            {materials.map((material) => (
              <article key={material.id} className="teacher-material-item">
                <FileIconByType type={material.materialType} />
                <div className="teacher-material-info">
                  <strong>{material.title}</strong>
                  <span>{material.fileName} {material.fileSize ? `• ${formatFileSize(material.fileSize)}` : ''}</span>
                  <span>Uploaded {formatTimestamp(material.createdAt)}</span>
                </div>
                <div className="teacher-material-actions">
                  {material.downloadUrl && (
                    <a href={material.downloadUrl} target="_blank" rel="noreferrer" className="teacher-icon-button" title="Download" aria-label="Download">
                      <DownloadIcon />
                    </a>
                  )}
                  <button type="button" className="teacher-icon-button danger" onClick={() => handleDelete(material.id)} title="Delete" aria-label="Delete">
                    <TrashIcon />
                  </button>
                </div>
              </article>
            ))}

            {!materialsLoading && materials.length === 0 && <p className="teacher-empty">No materials uploaded yet for this class.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
