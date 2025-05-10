import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import HomeTab from './HomeTab';
import WeeksTab from './tabs/WeeksTab';
import StudentsTab from './tabs/StudentsTab';
import SummaryTab from './tabs/SummaryTab';

const TabsView: React.FC = () => {
  const [tab, setTab] = React.useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={tab} onChange={handleChange} centered>
        <Tab label="Home" />
        <Tab label="Weeks" />
        <Tab label="Students" />
        <Tab label="Summary" />
      </Tabs>
      <Box sx={{ mt: 2 }}>
        {tab === 0 && <HomeTab />}
        {tab === 1 && <WeeksTab />}
        {tab === 2 && <StudentsTab />}
        {tab === 3 && <SummaryTab />}
      </Box>
    </Box>
  );
};

export default TabsView;
