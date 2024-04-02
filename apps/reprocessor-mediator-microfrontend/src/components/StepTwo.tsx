import React from 'react';
import { Grid, Typography, Button, Card, CardContent } from '@mui/material';

function SummaryScreen({ data, onBack, onReprocess, onCancel }) {
  const handleReprocess = async () => {
    try {
      const payload = {
        reprocessFromDate: data.reprocessFromDate,
        reprocessToDate: data.reprocessToDate,
        method: data.method,
        resources: data.resources
      }
      console.log(payload)
      const API_URL = process.env.REPROCESSOR_API_BASE_URL || 'http://localhost:3000/'

      const response = await fetch(API_URL + 'reprocess/mongo', {
        method: "POST",
        headers: {
          "Content_Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error("Failed to perform the Reprocess Request")
      }
      //Handle Success Here
    } catch (error) {
      console.error("Error encountered on reprocess POST Request:", error.message)
    }
  }

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
            <Typography>{data.numberOfTransactions}</Typography>
            <Typography>Resources to be Reprocessed</Typography>
            <Typography>{data.resources.join(', ')}</Typography>
            <Grid container justifyContent="flex-end" spacing={1}>
              <Grid item>
                <Button variant="contained" onClick={onBack}>
                  Back
                </Button>
              </Grid>
              <Grid item>
                <Button variant="contained" onClick={handleReprocess} color="primary">
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
