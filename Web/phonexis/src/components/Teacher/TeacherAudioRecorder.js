import { useEffect, useState } from 'react';
import { useVoiceRecorder } from '../../lib/useVoiceRecorder';
import { uploadPretestAudio } from '../../lib/supabaseClient';
import { MicIcon, StopIcon, TrashIcon } from './TeacherIcons';

const STUDIO_AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
  },
};

export default function TeacherAudioRecorder({ pretestId, teacherId, value, onChange, label }) {
  const { isRecording, audioBlob, error, startRecording, stopRecording, resetRecording } = useVoiceRecorder();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    if (!audioBlob) {
      return undefined;
    }

    let cancelled = false;

    const upload = async () => {
      setUploading(true);
      setUploadError(null);
      const result = await uploadPretestAudio(pretestId, teacherId, audioBlob);
      if (cancelled) {
        return;
      }
      setUploading(false);
      if (result.error) {
        setUploadError(result.error.message || 'Failed to upload recording');
      } else if (result.data) {
        onChange({ storagePath: result.data.storagePath, downloadUrl: result.data.downloadUrl });
      }
      resetRecording();
    };

    void upload();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording(STUDIO_AUDIO_CONSTRAINTS);
    }
  };

  return (
    <div className="teacher-audio-recorder">
      {label && (
        <div className="teacher-audio-recorder-head">
          <span>{label}</span>
          <span className="teacher-audio-quality-badge" title="Studio: Use clean microphone audio with natural processing.">Studio</span>
        </div>
      )}

      <div className="teacher-audio-recorder-controls">
        <button
          type="button"
          className={isRecording ? 'teacher-icon-button danger' : 'teacher-icon-button'}
          onClick={handleRecordToggle}
          disabled={uploading}
          title={isRecording ? 'Stop recording' : 'Record audio'}
          aria-label={isRecording ? 'Stop recording' : 'Record audio'}
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
        </button>

        {uploading && <span className="teacher-audio-status">Uploading...</span>}

        {value?.downloadUrl && !uploading && (
          <>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio controls src={value.downloadUrl} className="teacher-audio-preview" />
            <button
              type="button"
              className="teacher-icon-button danger"
              onClick={() => onChange(null)}
              title="Remove recording"
              aria-label="Remove recording"
            >
              <TrashIcon />
            </button>
          </>
        )}
      </div>

      {(error || uploadError) && <div className="teacher-error">{error || uploadError}</div>}
    </div>
  );
}
