import { useCallback, useEffect, useState } from 'react';
import './Teacher.css';
import { fetchTeacherClasses } from '../../lib/supabaseClient';
import { getDisplayName } from './teacherUtils';
import TeacherDashboard from './TeacherDashboard';
import TeacherLearningMaterials from './TeacherLearningMaterials';
import TeacherAcademicProgress from './TeacherAcademicProgress';

export default function Teacher({ user, backendUserId, activeSection }) {
  const section = activeSection || 'dashboard';
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
    dashboard: { title: `${teacherName}'s Classes`, subtitle: 'Create classes and manage each section’s roster.' },
    materials: { title: 'Learning Materials', subtitle: 'Share PPT, PDF, MP4, and MP3 files with your classes.' },
    progress: { title: 'Academic Progress', subtitle: 'Review each class’s students and their module progress.' },
  }[section];

  return (
    <section className="teacher-shell">
      <header className="teacher-topbar">
        <div>
          <p className="teacher-kicker">Teacher Workspace</p>
          <h2>{sectionCopy.title}</h2>
          <p className="teacher-subtitle">{sectionCopy.subtitle}</p>
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

      {section === 'progress' && (
        <TeacherAcademicProgress classes={classes} loading={classesLoading} />
      )}
    </section>
  );
}
