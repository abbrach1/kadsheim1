import React, { useEffect, useState } from 'react';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, MenuItem, Select, InputLabel, FormControl, FormControlLabel, Checkbox, Button } from '@mui/material';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Student, Week } from '../types';

const SummaryTab: React.FC = () => {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedWeekIds, setSelectedWeekIds] = useState<string[]>([]);
  const [studentFilter, setStudentFilter] = useState('');
  const [onlyAllWeeks, setOnlyAllWeeks] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const weeksSnap = await getDocs(collection(db, 'weeks'));
      setWeeks(weeksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Week));
      const studentsSnap = await getDocs(collection(db, 'students'));
      setStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Student));
    };
    fetchData();
  }, []);

  // Filtered data
  const filteredWeeks = selectedWeekIds.length > 0 ? weeks.filter(w => selectedWeekIds.includes(w.id)) : weeks;
  let filteredStudents = students.filter(s => s.name.toLowerCase().includes(studentFilter.toLowerCase()));

  // Students who did all filtered weeks (Full participation in each week)
  if (onlyAllWeeks && filteredWeeks.length > 0) {
    filteredStudents = filteredStudents.filter(student =>
      filteredWeeks.every(week => week.students.find(sp => sp.studentId === student.id)?.participation === 'InShabbos')
    );
  }

  // Export CSV for summary table
  const handleExportCsv = () => {
    const header = ['Student', ...filteredWeeks.map(w => w.title)];
    const rows = filteredStudents.map(student => [
      student.name,
      ...filteredWeeks.map(week => {
        const participation = week.students.find(sp => sp.studentId === student.id)?.participation || '-';
        return participation;
      })
    ]);
    const csv = [header, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    a.href = url;
    a.download = `summary-${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>Participation Summary</Typography>
        <Button variant="outlined" className="print-hide" onClick={() => window.print()}>Print Report</Button>
        <Button variant="outlined" className="print-hide" onClick={handleExportCsv}>Export CSV</Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter Weeks</InputLabel>
          <Select
            label="Filter Weeks"
            multiple
            value={selectedWeekIds}
            onChange={e => setSelectedWeekIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
            renderValue={selected => (selected as string[]).map(id => weeks.find(w => w.id === id)?.title).join(', ')}
          >
            {weeks.map(week => (
              <MenuItem key={week.id} value={week.id}>{week.title}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Filter Students"
          value={studentFilter}
          onChange={e => setStudentFilter(e.target.value)}
        />
        <FormControlLabel
          control={<Checkbox checked={onlyAllWeeks} onChange={e => setOnlyAllWeeks(e.target.checked)} />}
          label={`Show only students who did all weeks${filteredWeeks.length > 0 ? ` (${filteredWeeks.length})` : ''}`}
        />
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              {filteredWeeks.map(week => (
                <TableCell key={week.id}>{week.title}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map(student => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                {filteredWeeks.map(week => {
                  const participation = week.students.find(sp => sp.studentId === student.id)?.participation || '-';
                  return <TableCell key={week.id}>{participation}</TableCell>;
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SummaryTab;
