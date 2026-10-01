import { useCallback, useEffect, useState } from 'react';
import './Teacher.css';
import './TeacherWorkspace.css';
import { fetchTeacherClasses } from '../../lib/supabaseClient';
import { getDisplayName } from './teacherUtils';
import TeacherDashboard from './TeacherDashboard';
import TeacherLearningMaterials from './TeacherLearningMaterials';
import TeacherPretest from './TeacherPretest';
import TeacherAcademicProgress from './TeacherAcademicProgress';

export default function Teacher({ user, backendUserId, activeSection }) {
  const section = ['dashboard', 'materials', 'pretest', 'progress'].includes(activeSection)
    ? activeSection
    : 'dashboard';
  const teacherName = getDisplayName(user);

  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState(null);

  const loadClasses = useCallback(async () => {
    if (!backendUserId) {
      return;
    }

    setClassesLoading(true);
    const result = await fetchTeacherClasses(backendUserId);
    if (result.error) {
      setClassesError(result.error.message || 'Failed to load classes');
    } else {
      setClasses(Array.isArray(result.data) ? result.data : []);
      setClassesError(null);
    }
    setClassesLoading(false);
  }, [backendUserId]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  const sectionCopy = {
    dashboard: { eyebrow: `Welcome, ${teacherName}`, title: 'My Classes', subtitle: 'Open a class to manage its students.' },
    materials: { eyebrow: 'Teaching resources', title: 'Learning Materials', subtitle: 'Upload PPT, PDF, MP4 or MP3 files for a class.' },
    pretest: { eyebrow: 'Assessments', title: 'Pretest', subtitle: 'Build quizzes with your own voice recordings for each class.' },
    progress: { eyebrow: 'Reports', title: 'Academic Progress', subtitle: 'Click a student to see their modules, pretest scores and games.' },
  }[section];

  return (
    <section className="tw-theme tw-page teacher-shell">
      <header className="tw-header">
        <div>
          <p className="tw-eyebrow">{sectionCopy.eyebrow}</p>
          <h1>{sectionCopy.title}</h1>
          <p className="tw-lead">{sectionCopy.subtitle}</p>
        </div>
      </header>

      {section === 'dashboard' && (
        <TeacherDashboard
          backendUserId={backendUserId}
          classes={classes}
          loading={classesLoading}
          error={classesError}
          onClassesChanged={loadClasses}
        />
      )}

      {section === 'materials' && (
        <TeacherLearningMaterials backendUserId={backendUserId} classes={classes} loading={classesLoading} />
      )}

      {section === 'pretest' && (
        <TeacherPretest backendUserId={backendUserId} classes={classes} loading={classesLoading} />
      )}

      {section === 'progress' && (
        <TeacherAcademicProgress classes={classes} loading={classesLoading} />
      )}
    </section>
  );
}
