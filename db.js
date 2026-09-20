(function () {
  const STORAGE_KEYS = {
    teacher: 'cassy_teacher_profile',
    subjects: 'cassy_subjects'
  };

  const fallback = {
    getTeacher() {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.teacher) || 'null') || {
        id: 'teacher-default',
        name: 'Ms. Reyes',
        position: 'Class Adviser',
        className: 'Grade 7 - STEM',
        email: 'teacher@school.edu',
        phone: '0912-345-6789',
        bio: 'Guiding students with clear updates, reminders, and weekly learning goals.',
        classCode: 'CASSY-7STEM42',
        school: 'CASSY Academy'
      };
    },
    saveTeacher(data) {
      localStorage.setItem(STORAGE_KEYS.teacher, JSON.stringify(data));
    },
    getSubjects() {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.subjects) || '{}');
    },
    saveSubjects(data) {
      localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(data));
    }
  };

  const config = window.APP_DB_CONFIG || {};
  const provider = (config.provider || 'localStorage').toLowerCase();

  function isSupabaseReady() {
    return !!(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  }

  async function readRemote(key) {
    if (!isSupabaseReady()) return null;
    const { data, error } = await window.supabase.from(config.table || 'class_app').select('*').eq('key', key).single();
    if (error && error.code !== 'PGRST116') {
      console.warn('Database read failed:', error);
      return null;
    }
    return data ? data.value : null;
  }

  async function writeRemote(key, value) {
    if (!isSupabaseReady()) return false;
    const row = { key, value, updated_at: new Date().toISOString() };
    const { error } = await window.supabase.from(config.table || 'class_app').upsert(row, { onConflict: 'key' });
    if (error) {
      console.warn('Database write failed:', error);
      return false;
    }
    return true;
  }

  const api = {
    async getTeacher() {
      if (provider === 'supabase') {
        const remote = await readRemote('teacher');
        if (remote) return remote;
      }
      return fallback.getTeacher();
    },
    async saveTeacher(data) {
      if (provider === 'supabase') {
        const ok = await writeRemote('teacher', data);
        if (ok) return;
      }
      fallback.saveTeacher(data);
    },
    async getSubjects() {
      if (provider === 'supabase') {
        const remote = await readRemote('subjects');
        if (remote) return remote;
      }
      return fallback.getSubjects();
    },
    async saveSubjects(data) {
      if (provider === 'supabase') {
        const ok = await writeRemote('subjects', data);
        if (ok) return;
      }
      fallback.saveSubjects(data);
    }
  };

  window.CASSY_DB = api;
})();
