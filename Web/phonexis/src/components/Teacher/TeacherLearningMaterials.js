import { useEffect, useRef, useState } from 'react';
import { deleteLearningMaterial, fetchLearningMaterials, uploadLearningMaterial } from '../../lib/supabaseClient';
import { formatTimestamp } from './teacherUtils';
import { DownloadIcon, FileIconByType, TrashIcon } from './TeacherIcons';
import useConfirm from './useConfirm';
import TeacherHero from './TeacherHero';
import { celebrate, getClassColor } from './TeacherFx';

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
  const [chosenFile, setChosenFile] = useState(null);
  const [notice, setNotice] = useState(null);
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
    setNotice(null);
    const result = await uploadLearningMaterial(selectedClassId, backendUserId, file, title.trim());
    setUploading(false);

    if (result.error) {
      setError(result.error.message || 'Failed to upload material');
      return;
    }

    setTitle('');
    setChosenFile(null);
    setNotice(`Uploaded “${file.name}”.`);
    celebrate();
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

  const selectedClassName = classes.find((classItem) => classItem.id === selectedClassId)?.name || 'this class';
  const selectedClassIndex = Math.max(0, classes.findIndex((classItem) => classItem.id === selectedClassId));
  const countType = (...types) => materials.filter((material) => types.includes(String(material.materialType || '').toLowerCase())).length;

  if (!loading && classes.length === 0) {
    return (
      <>
        <TeacherHero eyebrow="📚 Teaching resources" title="Learning Materials" subtitle="Share slides, PDFs, videos and audio with a class." />
        <section className="tw-card" aria-label="Learning materials">
          <div className="tw-empty">
            <span className="tw-empty-icon" aria-hidden="true">📚</span>
            <strong>Create a class first</strong>
            <p>Go to My Classes and create a class, then come back here to share files with its students.</p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {confirmDialog}

      <TeacherHero
        eyebrow="📚 Teaching resources"
        title="Learning Materials"
        subtitle="Share slides, PDFs, videos and audio with a class. Students can open them from their Class page."
        stats={[
          { key: 'files', icon: '🗂️', label: `Files in ${selectedClassName}`, value: materials.length, loading: materialsLoading },
          { key: 'docs', icon: '📄', label: 'Slides & PDFs', value: countType('ppt', 'pptx', 'pdf'), loading: materialsLoading },
          { key: 'videos', icon: '🎬', label: 'Videos', value: countType('mp4'), loading: materialsLoading },
          { key: 'audio', icon: '🎵', label: 'Audio', value: countType('mp3'), loading: materialsLoading },
        ]}
      >
        <div>
          <span className="tw-toolbar-label">Class </span>
          <div className="tw-segment" role="group" aria-label="Select class">
            {classes.map((classItem) => (
              <button
                key={classItem.id}
                type="button"
                className={selectedClassId === classItem.id ? 'active' : ''}
                aria-pressed={selectedClassId === classItem.id}
                onClick={() => setSelectedClassId(classItem.id)}
              >
                {classItem.name}
              </button>
            ))}
          </div>
        </div>
      </TeacherHero>

      <div className={`tw-grid-2 tw-c-${getClassColor(selectedClassIndex)}`}>
        <section className="tw-card" aria-label="Shared materials">
          <div className="tw-card-head">
            <div>
              <h2>Shared with {selectedClassName}</h2>
              <p>{materialsLoading ? 'Loading…' : `${materials.length} file${materials.length === 1 ? '' : 's'} your students can open`}</p>
            </div>
          </div>

          {!materialsLoading && materials.length === 0 ? (
            <div className="tw-empty">
              <span className="tw-empty-icon" aria-hidden="true">🗂️</span>
              <strong>No files yet</strong>
              <p>Upload a file on the right and it will appear here for your students.</p>
            </div>
          ) : (
            <div className="tw-table-wrap">
              <table className="tw-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th className="tw-hide-sm">Uploaded</th>
                    <th className="tw-num"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material, index) => (
                    <tr key={material.id} style={{ animationDelay: `${index * 40}ms` }}>
                      <td>
                        <div className="tw-person">
                          <span className="tw-file-icon"><FileIconByType type={material.materialType} /></span>
                          <span>
                            <strong>{material.title}</strong>
                            <span>
                              {String(material.materialType || '').toUpperCase()}
                              {material.fileSize ? ` · ${formatFileSize(material.fileSize)}` : ''}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="tw-hide-sm">{formatTimestamp(material.createdAt)}</td>
                      <td className="tw-num">
                        <div className="tw-actions">
                          {material.downloadUrl && (
                            <a href={material.downloadUrl} target="_blank" rel="noreferrer" className="tw-icon-btn" title="Download" aria-label={`Download ${material.title}`}>
                              <DownloadIcon />
                            </a>
                          )}
                          <button type="button" className="tw-icon-btn danger" onClick={() => handleDelete(material.id)} title="Delete" aria-label={`Delete ${material.title}`}>
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="tw-card" aria-label="Upload material">
          <div className="tw-card-head">
            <div>
              <h2>Upload a file</h2>
              <p>PPT, PDF, MP4 or MP3</p>
            </div>
          </div>

          <form onSubmit={handleUpload}>
            <label className="tw-field">
              <span>Title <small>(optional)</small></span>
              <input className="tw-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Week 3 - Vowel Sounds" />
            </label>

            <div className="tw-field">
              <span>File</span>
              <label className={`tw-dropzone ${chosenFile ? 'has-file' : ''}`}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  onChange={(event) => setChosenFile(event.target.files?.[0] || null)}
                />
                <span className="tw-dropzone-icon" aria-hidden="true">{chosenFile ? '📄' : '⬆️'}</span>
                <strong>{chosenFile ? chosenFile.name : 'Click to choose a file'}</strong>
                <span>{chosenFile ? formatFileSize(chosenFile.size) : 'or drag it here'}</span>
              </label>
            </div>

            {error && <div className="tw-alert error">{error}</div>}
            {notice && <div className="tw-alert success">{notice}</div>}

            <button type="submit" className="tw-btn tw-btn-primary tw-btn-block" disabled={uploading || !selectedClassId || !chosenFile}>
              {uploading ? 'Uploading…' : `Upload to ${selectedClassName}`}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
