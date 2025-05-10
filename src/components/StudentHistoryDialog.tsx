import React from 'react';
import { Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell, TableBody, Typography, Button } from '@mui/material';
import { Week, StudentParticipation } from '../types';

interface StudentHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  studentName: string;
  history: { week: Week; participation: StudentParticipation | undefined }[];
}

const StudentHistoryDialog: React.FC<StudentHistoryDialogProps> = ({ open, onClose, studentName, history }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Participation History for {studentName}</DialogTitle>
    <DialogContent>
      {history.length === 0 ? (
        <Typography>No participation found for this student.</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Week</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Participation</TableCell>
              <TableCell>Hours Learned</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map(({ week, participation }) => (
              <TableRow key={week.id}>
                <TableCell>{week.title}</TableCell>
                <TableCell>{week.date}</TableCell>
                <TableCell>{participation ? participation.participation : '-'}</TableCell>
                <TableCell>{participation && participation.hoursLearned != null ? participation.hoursLearned : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Button onClick={onClose} sx={{ mt: 2 }} variant="outlined">Close</Button>
    </DialogContent>
  </Dialog>
);

export default StudentHistoryDialog;
