import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, MenuItem, Select, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Week, StudentParticipation, ParticipationLevel, Student } from '../types';

const participationOptions = [
  { value: 'DidNotParticipate', label: 'Did not participate' },
  { value: 'InShabbos', label: 'In shabbos' },
  { value: 'OneMealOut', label: 'One meal out' },
  { value: 'OutShabbos', label: 'Out shabbos' },
];

const WeeksTab: React.FC = () => {
  // Print only the selected week's report
  const handlePrintWeek = (weekId: string) => {
    // Hide all .print-report-week except the selected one
    const allReports = document.querySelectorAll('.print-report-week');
    allReports.forEach(el => (el as HTMLElement).style.display = 'none');
    const target = document.querySelector('.print-report-week-' + weekId) as HTMLElement | null;
    if (target) target.style.display = 'block';
    // Hide everything else except .print-report
    window.print();
    // Restore all
    setTimeout(() => {
      allReports.forEach(el => (el as HTMLElement).style.display = 'none');
    }, 500);
  };

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

  // Update hours learned for a student in the edit dialog
  const handleEditHoursChange = (studentId: string, hours: number) => {
    setEditParticipations(prev => prev.map(p => p.studentId === studentId ? { ...p, hoursLearned: hours } : p));
  };
  // Update hours learned for a student in the add week dialog
  const handleHoursChange = (studentId: string, hours: number) => {
    setParticipations(prev => prev.map(p => p.studentId === studentId ? { ...p, hoursLearned: hours } : p));
  };

  const [weeks, setWeeks] = useState<Week[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [newWeekTitle, setNewWeekTitle] = useState('');
  const [newWeekDate, setNewWeekDate] = useState('');
  const [participations, setParticipations] = useState<StudentParticipation[]>([]);

  useEffect(() => {
    // Fetch weeks from Firestore
    const fetchWeeks = async () => {
      const weeksSnap = await getDocs(collection(db, 'weeks'));
      setWeeks(weeksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Week));
    };
    // Fetch students
    const fetchStudents = async () => {
      const studentsSnap = await getDocs(collection(db, 'students'));
      setStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Student));
    };
    fetchWeeks();
    fetchStudents();
  }, []);

  const handleOpen = () => {
    setParticipations(students.map(s => ({ studentId: s.id, participation: 'DidNotParticipate' })));
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleParticipationChange = (studentId: string, level: ParticipationLevel) => {
    setParticipations(prev => prev.map(p => p.studentId === studentId ? { ...p, participation: level } : p));
  };

  const handleAddWeek = async () => {
    await addDoc(collection(db, 'weeks'), {
      title: newWeekTitle,
      date: newWeekDate,
      students: participations,
    });
    setOpen(false);
    setNewWeekTitle('');
    setNewWeekDate('');
    // Refresh weeks
    const weeksSnap = await getDocs(collection(db, 'weeks'));
    setWeeks(weeksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Week));
  };

  const handleDeleteWeek = async (weekId: string) => {
    await deleteDoc(doc(db, 'weeks', weekId));
    // Refresh weeks
    const weeksSnap = await getDocs(collection(db, 'weeks'));
    setWeeks(weeksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Week));
  };

  // Add/Remove students for a week
  const handleUpdateWeekStudents = async (weekId: string, newParticipations: StudentParticipation[]) => {
    await updateDoc(doc(db, 'weeks', weekId), { students: newParticipations });
    // Refresh weeks
    const weeksSnap = await getDocs(collection(db, 'weeks'));
    setWeeks(weeksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Week));
  };

  // Dialog for editing students in a week
  const [editWeekId, setEditWeekId] = useState<string | null>(null);
  const [editParticipations, setEditParticipations] = useState<StudentParticipation[]>([]);

  const openEditDialog = (week: Week) => {
    setEditWeekId(week.id);
    setEditParticipations(week.students);
  };
  const closeEditDialog = () => setEditWeekId(null);

  const handleEditParticipationChange = (studentId: string, level: ParticipationLevel) => {
    setEditParticipations(prev => prev.map(p => p.studentId === studentId ? { ...p, participation: level } : p));
  };
  const handleEditAddStudent = (student: Student) => {
    if (!editParticipations.some(p => p.studentId === student.id)) {
      setEditParticipations(prev => [...prev, { studentId: student.id, participation: 'DidNotParticipate' }]);
    }
  };
  const handleEditRemoveStudent = (studentId: string) => {
    setEditParticipations(prev => prev.filter(p => p.studentId !== studentId));
  };
  const handleEditSave = async () => {
    if (editWeekId) {
      await handleUpdateWeekStudents(editWeekId, editParticipations);
      setEditWeekId(null);
    }
  };

  return (
    <Box>
      {/* Printable Report Section */}
      {weeks.map(week => (
        <div
          key={week.id}
          className={`print-report print-report-week print-report-week-${week.id}`}
          style={{ display: 'none' }}
        >
          <h1>Kodesh M Tracker - Week Report</h1>
          <div style={{ marginBottom: 16 }}>
            <strong>Generated:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </div>
          <h2 style={{ margin: 0 }}>{week.title} ({week.date})</h2>
          <div style={{ marginBottom: 8 }}>
            <strong>Total hours learned:</strong> {week.students.reduce((sum, sp) => sum + (sp.hoursLearned ?? 0), 0)}
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Participation</th>
                <th>Hours Learned</th>
              </tr>
            </thead>
            <tbody>
              {week.students.map(sp => {
                const student = students.find(s => s.id === sp.studentId);
                return (
                  <tr key={sp.studentId}>
                    <td>{student ? student.name : sp.studentId}</td>
                    <td>{sp.participation}</td>
                    <td>{sp.hoursLearned ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
      {/* End Printable Report Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>Weeks</Typography>
        <Button variant="outlined" className="print-hide" onClick={() => window.print()}>Print Report</Button>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" color="primary">
          Grand Total Hours Learned (All Weeks): {weeks.reduce((total, week) => total + week.students.reduce((sum, sp) => sum + (sp.hoursLearned ?? 0), 0), 0)}
        </Typography>
      </Box>
      <Button variant="contained" color="primary" onClick={handleOpen}>Add Week</Button>
      <Box sx={{ mt: 2 }}>
        {weeks.map(week => (
          <Box key={week.id} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ mb: 0 }}>
                {week.title} ({week.date})
                <span style={{ fontWeight: 'normal', fontSize: '1rem', marginLeft: 12 }}>
                  | Total hours learned: {week.students.reduce((sum, sp) => sum + (sp.hoursLearned ?? 0), 0)}
                </span>
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" className="print-hide" onClick={() => handlePrintWeek(week.id)}>
                  Print This Week
                </Button>
                <Button size="small" className="print-hide" onClick={() => handleExportCsv(week.id)}>
                  Export CSV
                </Button>
              </Box>
            </Box>
            <List>
              {week.students.map(sp => (
                <ListItem key={sp.studentId}>
                  <ListItemText
                    primary={students.find(s => s.id === sp.studentId)?.name || 'Unknown'}
                  />
                  <RadioGroup
                    row
                    value={sp.participation}
                    onChange={e => handleEditParticipationChange(sp.studentId, e.target.value as ParticipationLevel)}
                  >
                    {participationOptions.map(opt => (
                      <FormControlLabel
                        key={opt.value}
                        value={opt.value}
                        control={<Radio />}
                        label={opt.label}
                      />
                    ))}
                  </RadioGroup>
                  <TextField
                    type="number"
                    label="Hours Learned"
                    size="small"
                    sx={{ width: 100, ml: 2 }}
                    value={sp.hoursLearned ?? 0}
                    onChange={e => handleEditHoursChange(sp.studentId, Number(e.target.value))}
                    inputProps={{ min: 0 }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleEditRemoveStudent(sp.studentId)}>
                      <span role="img" aria-label="delete">❌</span>
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            <Button size="small" variant="outlined" onClick={() => openEditDialog(week)} sx={{ mr: 1 }}>Edit Students</Button>
            <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteWeek(week.id)}>Delete</Button>
          </Box>
        ))}
      </Box>
      {/* Edit students in week dialog */}
      <Dialog open={!!editWeekId} onClose={closeEditDialog}>
        <DialogTitle>Edit Students in Week</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1">Current Students</Typography>
          <List>
            {editParticipations.map(p => (
              <ListItem key={p.studentId}>
                <ListItemText
                  primary={students.find(s => s.id === p.studentId)?.name || 'Unknown'}
                  secondary={`Total this week: ${p.hoursLearned ?? 0} hrs`}
                />
                <RadioGroup
                  row
                  value={p.participation}
                  onChange={e => handleEditParticipationChange(p.studentId, e.target.value as ParticipationLevel)}
                >
                  {participationOptions.map(opt => (
                    <FormControlLabel
                      key={opt.value}
                      value={opt.value}
                      control={<Radio />}
                      label={opt.label}
                    />
                  ))}
                </RadioGroup>
                <TextField
                  type="number"
                  label="Hours Learned"
                  size="small"
                  sx={{ width: 100, ml: 2 }}
                  value={p.hoursLearned ?? 0}
                  onChange={e => handleEditHoursChange(p.studentId, Number(e.target.value))}
                  inputProps={{ min: 0 }}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="delete" onClick={() => handleEditRemoveStudent(p.studentId)}>
                    <span role="img" aria-label="delete">❌</span>
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Add Student</Typography>
          {students.filter(s => !editParticipations.some(p => p.studentId === s.id)).map(student => (
            <Button key={student.id} onClick={() => handleEditAddStudent(student)} sx={{ mr: 1, mb: 1 }} variant="outlined">{student.name}</Button>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Week</DialogTitle>
        <DialogContent>
          <TextField label="Week Title" value={newWeekTitle} onChange={e => setNewWeekTitle(e.target.value)} fullWidth sx={{ mb: 2 }} />
          <TextField label="Date" type="date" InputLabelProps={{ shrink: true }} value={newWeekDate} onChange={e => setNewWeekDate(e.target.value)} fullWidth sx={{ mb: 2 }} />
          <Typography variant="subtitle1">Student Participation</Typography>
          <List>
            {students.map(student => (
              <ListItem key={student.id}>
                <ListItemText
                  primary={student.name}
                />
                <RadioGroup
                  row
                  value={participations.find(p => p.studentId === student.id)?.participation || 'DidNotParticipate'}
                  onChange={e => handleParticipationChange(student.id, e.target.value as ParticipationLevel)}
                >
                  {participationOptions.map(opt => (
                    <FormControlLabel
                      key={opt.value}
                      value={opt.value}
                      control={<Radio />}
                      label={opt.label}
                    />
                  ))}
                </RadioGroup>
                <TextField
                  type="number"
                  label="Hours Learned"
                  size="small"
                  sx={{ width: 100, ml: 2 }}
                  value={participations.find(p => p.studentId === student.id)?.hoursLearned ?? 0}
                  onChange={e => handleHoursChange(student.id, Number(e.target.value))}
                  inputProps={{ min: 0 }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAddWeek} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeeksTab;
