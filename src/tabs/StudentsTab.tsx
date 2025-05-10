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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

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

  // Edit student name
  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setEditName(student.name);
    setEditDialogOpen(true);
  };
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedStudent(null);
  };
  const handleEditDialogSave = async () => {
    if (selectedStudent && editName.trim()) {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'students', selectedStudent.id), { name: editName.trim() });
      const snap = await getDocs(collection(db, 'students'));
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Student));
      setEditDialogOpen(false);
      setSelectedStudent(null);
    }
  };

  // Delete student
  const handleDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  };
  const handleDeleteDialogConfirm = async () => {
    if (studentToDelete) {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'students', studentToDelete.id));
      const snap = await getDocs(collection(db, 'students'));
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Student));
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
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
            sx={{ mb: 1, p: 1, border: '1px solid #eee', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', '&:hover': { background: '#f3f3f3' } }}
          >
            <span style={{ cursor: 'pointer', flex: 1 }} onClick={() => handleOpenHistory(student)}>{student.name}</span>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" onClick={() => handleEditStudent(student)} title="Edit Name">✏️</Button>
              <Button size="small" color="error" onClick={() => handleDeleteStudent(student)} title="Delete">🗑️</Button>
            </Box>
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
      {/* Edit Name Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
        <DialogTitle>Edit Student Name</DialogTitle>
        <DialogContent>
          <TextField
            label="Student Name"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button onClick={handleEditDialogSave} variant="contained" disabled={!editName.trim()}>Save</Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Student</DialogTitle>
        <DialogContent>
          Are you sure you want to delete student "{studentToDelete?.name}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteDialogConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
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
