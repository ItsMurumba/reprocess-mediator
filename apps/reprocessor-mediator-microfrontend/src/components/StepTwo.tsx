import React from 'react';
import { Grid, Typography, Button, Card, CardContent } from '@mui/material';

function SummaryScreen({ data, onBack, onReprocess, onCancel }) {
  return (
    <Grid container justifyContent="center" alignItems="center">
      <Grid item xs={10} md={6} lg={6}>
        <Card>
          <CardContent>
            <Typography variant="h4">Re-Processor Summary</Typography>
            <Typography>Selected Data Range</Typography>
            <Typography>
              {data.reprocessFromDate} - {data.reprocessToDate}
            </Typography>
            <Typography>Number of Transactions</Typography>
            <Typography>{data.resources.length}</Typography>
            <Typography>Resources to be Reprocessed</Typography>
            <Typography>{data.resources.join(', ')}</Typography>
            <Grid container justifyContent="flex-end" spacing={1}>
              <Grid item>
                <Button variant="contained" onClick={onBack}>
                  Back
                </Button>
              </Grid>
              <Grid item>
                <Button variant="contained" onClick={onReprocess} color="primary">
                  Reprocess
                </Button>
              </Grid>
              <Grid item>
                <Button variant="contained" onClick={onCancel}>
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default SummaryScreen;
