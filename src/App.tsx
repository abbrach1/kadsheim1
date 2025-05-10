import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import TabsView from './TabsView';
import './App.css';
import './print.css';

function App() {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <img src="/kodesh-logo.png" alt="Kodesh Logo" style={{ maxWidth: 140, margin: '0 auto 12px', display: 'block' }} />
          <Typography variant="h4" component="h1" gutterBottom style={{ fontFamily: 'inherit', letterSpacing: 2 }}>
            קדשמ - Weekly Program Tracker
          </Typography>
        </Box>
        <TabsView />
      </Paper>
    </Container>
  );
}

export default App;
