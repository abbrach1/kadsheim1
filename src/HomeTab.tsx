import React, { useEffect, useState } from 'react';
import StudentParticipationEditor from './components/StudentParticipationEditor';
import { Box, Typography, Paper, Button, Checkbox, List, ListItem, ListItemText, ListItemSecondaryAction, FormControlLabel, Snackbar, Alert, TextField } from '@mui/material';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Week, Student, StudentParticipation } from './types';

const HomeTab: React.FC = () => {
  const [printWeekId, setPrintWeekId] = useState<string | null>(null);

  const [weekSearchQueries, setWeekSearchQueries] = useState<{ [weekId: string]: string }>({});

  // Print only the selected week's report
  const handlePrintWeek = (weekId: string) => {
    setPrintWeekId(weekId);
  };

  // Print effect: when printWeekId is set, print and reset after
  useEffect(() => {
    if (printWeekId) {
      window.print();
      const cleanup = () => setPrintWeekId(null);
      window.addEventListener('afterprint', cleanup, { once: true });
      return () => window.removeEventListener('afterprint', cleanup);
    }
  }, [printWeekId]);

  // Export CSV for a week
  const handleExportCsv = (weekId: string) => {
    const week = weeks.find(w => w.id === weekId);
    if (!week) return;
    const header = ['Student Name', 'Participation', 'Hours Learned'];
    const rows = week.students.map(sp => {
      const student = students.find(s => s.id === sp.studentId);
      return [
        student ? student.name : sp.studentId,
        sp.participation,
        sp.hoursLearned ?? 0
      ];
    });
    const csv = [header, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `week-${week.title.replace(/\s+/g, '_')}-${week.date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  // Highlight search matches
  function highlightMatch(name: string, query: string): React.ReactNode {
    if (!query) return name;
    const idx = name.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return name;
    return <>{name.substring(0, idx)}<mark style={{ background: 'yellow', fontWeight: 'bold' }}>{name.substring(idx, idx + query.length)}</mark>{name.substring(idx + query.length)}</>;
  }


  // Handler for week search bar
  const handleWeekSearchChange = (weekId: string, value: string) => {
    setWeekSearchQueries(prev => ({ ...prev, [weekId]: value }));
  };

  const [newStudentParticipation, setNewStudentParticipation] = useState<'DidNotParticipate' | 'InShabbos' | 'OneMealOut' | 'OutShabbos'>('DidNotParticipate');
  const [newStudentHours, setNewStudentHours] = useState<number>(0);

  const [weeks, setWeeks] = useState<Week[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [expandedWeekId, setExpandedWeekId] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [newStudentsText, setNewStudentsText] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const weeksSnap = await getDocs(collection(db, 'weeks'));
      const weeksList = weeksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Week);
      setWeeks(weeksList);
      if (weeksList.length > 0) {
        // Sort by date descending, select most recent
        const sorted = weeksList.slice().sort((a, b) => b.date.localeCompare(a.date));
        setSelectedWeek(sorted[0]);
        setExpandedWeekId(null);
      }
      const studentsSnap = await getDocs(collection(db, 'students'));
      setStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Student));
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      setSelectedStudentIds(selectedWeek.students.map(sp => sp.studentId));
    }
  }, [selectedWeek]);

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAddStudents = async () => {
    if (!selectedWeek) return;
    // Add all selected students to the week with 'InShabbos' participation
    const newParticipations: StudentParticipation[] = [
      ...selectedWeek.students.filter(sp => selectedStudentIds.includes(sp.studentId)),
      ...students
        .filter(s => selectedStudentIds.includes(s.id) && !selectedWeek.students.some(sp => sp.studentId === s.id))
        .map(s => ({ studentId: s.id, participation: 'InShabbos' as const, hoursLearned: 0 })),
    ];
    await updateDoc(doc(db, 'weeks', selectedWeek.id), { students: newParticipations });
    setSnackbarOpen(true);
    // Refresh week
    const weeksSnap = await getDocs(collection(db, 'weeks'));
    const weeksList = weeksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Week);
    setWeeks(weeksList);
    const sorted = weeksList.slice().sort((a, b) => b.date.localeCompare(a.date));
    setSelectedWeek(sorted[0]);
  };

  if (!selectedWeek) {
    return <Typography>No weeks found. Please add a week first.</Typography>;
  }

  const handleExpandWeek = (weekId: string) => {
    setExpandedWeekId(prev => prev === weekId ? null : weekId);
    const week = weeks.find(w => w.id === weekId);
    if (week) setSelectedWeek(week);
  };

  // Add a single new student with participation/hours for a week
  const handleAddSingleStudent = async (weekId: string) => {
    const name = newStudentsText.trim();
    if (!name) return;
    // Check if student exists
    let student = students.find(s => s.name === name);
    let studentId = student?.id;
    if (!student) {
      // Add student to Firestore
      const docRef = await (await import('firebase/firestore')).addDoc(collection(db, 'students'), { name });
      studentId = docRef.id;
      // Refresh students
      const studentsSnap = await getDocs(collection(db, 'students'));
      const studentsList = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Student);
      setStudents(studentsList);
    }
    // Add to week
    const week = weeks.find(w => w.id === weekId);
    if (!week || !studentId) return;
    const already = week.students.find(sp => sp.studentId === studentId);
    if (!already) {
      const newParticipation: StudentParticipation = {
        studentId,
        participation: newStudentParticipation,
        hoursLearned: newStudentHours,
      };
      const updatedStudents = [...week.students, newParticipation];
      await updateDoc(doc(db, 'weeks', weekId), { students: updatedStudents });
      // Refresh weeks
      const weeksSnap = await getDocs(collection(db, 'weeks'));
      const weeksList = weeksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Week);
      setWeeks(weeksList);
      setNewStudentsText('');
      setNewStudentParticipation('DidNotParticipate');
      setNewStudentHours(0);
    }
  };

// Edit participation for a student in a week
  const handleEditParticipation = async (weekId: string, studentId: string, participation: 'DidNotParticipate' | 'InShabbos' | 'OneMealOut' | 'OutShabbos') => {
    const week = weeks.find(w => w.id === weekId);
    if (!week) return;
    const updatedStudents = week.students.map(sp =>
      sp.studentId === studentId ? { ...sp, participation } : sp
    );
    await updateDoc(doc(db, 'weeks', weekId), { students: updatedStudents });
    // Refresh weeks
    const weeksSnap = await getDocs(collection(db, 'weeks'));
    const weeksList = weeksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Week);
    setWeeks(weeksList);
  };

// Edit hours learned for a student in a week
  const handleEditHours = async (weekId: string, studentId: string, hours: number) => {
    const week = weeks.find(w => w.id === weekId);
    if (!week) return;
    const updatedStudents = week.students.map(sp =>
      sp.studentId === studentId ? { ...sp, hoursLearned: hours } : sp
    );
    await updateDoc(doc(db, 'weeks', weekId), { students: updatedStudents });
    // Refresh weeks
    const weeksSnap = await getDocs(collection(db, 'weeks'));
    const weeksList = weeksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Week);
    setWeeks(weeksList);
  };

// Add multiple new students
  const handleAddNewStudents = async () => {
    const names = newStudentsText
      .split(/\n|,/)
      .map(n => n.trim())
      .filter(n => n.length > 0 && !students.some(s => s.name === n));
    if (names.length === 0) return;
    // Add all new students to Firestore
    const addedIds: string[] = [];
    for (const name of names) {
      const docRef = await (await import('firebase/firestore')).addDoc(collection(db, 'students'), { name });
      addedIds.push(docRef.id);
    }
    // Refresh students
    const studentsSnap = await getDocs(collection(db, 'students'));
    const studentsList = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Student);
    setStudents(studentsList);
    // Auto-select new students
    setSelectedStudentIds(prev => [...prev, ...studentsList.filter(s => addedIds.includes(s.id)).map(s => s.id)]);
    setNewStudentsText('');
    setSnackbarOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>Home - Add Students to Most Recent Week</Typography>
        <Button variant="outlined" className="print-hide" onClick={() => window.print()}>Print Report</Button>
      </Box>
      {/* Printable Report Section - always present in DOM */}
      <div className="print-report" style={{ display: printWeekId ? 'block' : 'none' }}>
        {weeks.map(week => (
          printWeekId === week.id ? (
            <div className={`print-report-week print-report-week-${week.id}`} key={week.id}>
              <Typography variant="h6">{week.title} ({week.date})</Typography>
              <List>
                {week.students.map(sp => (
                  <ListItem key={sp.studentId} sx={{ alignItems: 'flex-start' }}>
                    <StudentParticipationEditor
                      name={students.find(s => s.id === sp.studentId)?.name || sp.studentId}
                      participation={sp.participation}
                      hoursLearned={sp.hoursLearned ?? 0}
                      onParticipationChange={() => {}}
                      onHoursChange={() => {}}
                      disabled
                    />
                  </ListItem>
                ))}
              </List>
            </div>
          ) : null
        ))}
      </div>

      {weeks.slice().sort((a, b) => b.date.localeCompare(a.date)).map(week => (
        <Paper sx={{ p: 2, mb: 2 }} key={week.id}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{week.title} ({week.date})</Typography>
            <Button onClick={() => handleExpandWeek(week.id)}>
              {expandedWeekId === week.id ? 'Collapse' : 'Expand'}
            </Button>
          </Box>
          {expandedWeekId === week.id && (
            <>
              {/* Print Report Button */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                <Button size="small" className="print-hide" onClick={() => handlePrintWeek(week.id)}>
                  Print Report
                </Button>
                <Button size="small" className="print-hide" onClick={() => handleExportCsv(week.id)}>
                  Export CSV
                </Button>
              </Box>
              {/* Search Bar Centered */}
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Search students..."
                  size="small"
                  sx={{ width: 240 }}
                  value={weekSearchQueries[week.id] || ''}
                  onChange={e => handleWeekSearchChange(week.id, e.target.value)}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Add New Student for this Week</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    label="Student Name"
                    value={newStudentsText}
                    onChange={e => setNewStudentsText(e.target.value) }
                    size="small"
                    sx={{ width: 180 }}
                  />
                  <StudentParticipationEditor
                    participation={newStudentParticipation}
                    hoursLearned={newStudentHours}
                    onParticipationChange={setNewStudentParticipation}
                    onHoursChange={setNewStudentHours}
                  />
                  <Button variant="outlined" sx={{ height: 40 }} onClick={() => handleAddSingleStudent(week.id)}>Add</Button>
                </Box>
              </Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Edit Students for this Week</Typography>
              <List>
                {week.students
                  .filter(sp => {
                    const student = students.find(s => s.id === sp.studentId);
                    const search = (weekSearchQueries[week.id] || '').toLowerCase();
                    return !search || (student && student.name.toLowerCase().includes(search));
                  })
                  .map(sp => {
                    const student = students.find(s => s.id === sp.studentId);
                    return (
                      <ListItem key={sp.studentId} sx={{ alignItems: 'flex-start' }}>
                         <StudentParticipationEditor
                           name={student ? highlightMatch(student.name, weekSearchQueries[week.id] || '') : sp.studentId}
                           participation={sp.participation}
                           hoursLearned={sp.hoursLearned ?? 0}
                           onParticipationChange={(val: typeof sp.participation) => handleEditParticipation(week.id, sp.studentId, val)}
                           onHoursChange={(val: number) => handleEditHours(week.id, sp.studentId, val)}
                         />
                      </ListItem>
                    );
                  })}
              </List>

            </>
          )}
        </Paper>
      ))}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Students updated for {selectedWeek.title}!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HomeTab;
