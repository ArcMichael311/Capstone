import { useCallback, useEffect, useState } from 'react';
import './Teacher.css';
import './TeacherWorkspace.css';
import './TeacherModern.css';
import TeacherHero from './TeacherHero';
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

  return (
    <section className="tw-theme tw-page teacher-shell">
      {section === 'pretest' && (
        <TeacherHero
          eyebrow="📝 Assessments"
          title="Pretest"
          subtitle="Build quizzes with your own voice recordings for each class."
          stats={[
            { key: 'classes', icon: '🏫', label: 'Classes', value: classes.length, loading: classesLoading },
          ]}
        />
      )}

      {section === 'dashboard' && (
        <TeacherDashboard
          teacherName={teacherName}
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
