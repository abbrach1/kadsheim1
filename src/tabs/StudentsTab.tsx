import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Student, Week } from '../types';
import StudentHistoryDialog from '../components/StudentHistoryDialog';

const StudentsTab: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDocs(collection(db, 'students'));
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Student));
      const weeksSnap = await getDocs(collection(db, 'weeks'));
      setWeeks(weeksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Week));
    };
    fetchData();
  }, []);

  const handleAddStudent = async () => {
    await addDoc(collection(db, 'students'), { name: newName });
    setOpen(false);
    setNewName('');
    // Refresh
    const snap = await getDocs(collection(db, 'students'));
    setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Student));
  };

  const handleOpenHistory = (student: Student) => {
    setSelectedStudent(student);
    setHistoryOpen(true);
  };

  const handleCloseHistory = () => {
    setHistoryOpen(false);
    setSelectedStudent(null);
  };


  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>Students</Typography>
        <Button variant="outlined" className="print-hide" onClick={() => window.print()}>Print Report</Button>
      </Box>
      <Button variant="contained" color="primary" onClick={() => setOpen(true)}>Add Student</Button>
      <Box sx={{ mt: 2 }}>
        {students.map(student => (
          <Box
            key={student.id}
            sx={{ mb: 1, p: 1, border: '1px solid #eee', borderRadius: 1, cursor: 'pointer', '&:hover': { background: '#f3f3f3' } }}
            onClick={() => handleOpenHistory(student)}
          >
            {student.name}
          </Box>
        ))}
      </Box>
      <StudentHistoryDialog
        open={historyOpen}
        onClose={handleCloseHistory}
        studentName={selectedStudent?.name || ''}
        history={selectedStudent ? weeks.map(week => ({
          week,
          participation: week.students.find(sp => sp.studentId === selectedStudent.id)
        })) : []}
      />
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Student</DialogTitle>
        <DialogContent>
          <TextField label="Student Name" value={newName} onChange={e => setNewName(e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddStudent} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentsTab;
