import React, { useState } from "react";
import {
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { CheckCircle, ErrorRounded } from "@mui/icons-material";

function SummaryScreen({ data, onBack, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const handleReprocess = async () => {
    setLoading(true);
    try {
      const resourcesArray = data.resources
        .split(",")
        .map((resource) => resource.trim());

      const payload = {
        reprocessFromDate: data.reprocessFromDate,
        reprocessToDate: data.reprocessToDate,
        method: data.method,
        ...(data.method === "POST" ? { resources: resourcesArray } : {}),
      };

      const API_URL =
        process.env.REPROCESSOR_API_BASE_URL || "http://localhost:3000";
      const response = await fetch(API_URL + "/reprocess/mongo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to perform the Reprocess Request");
      }
      console.log("Reprocess was successful");
      setSuccess(true);
    } catch (error) {
      console.error(
        "Error encountered on reprocess POST Request:",
        error.message
      );
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      style={{ height: "90vh" }}
    >
      <Grid item xs={10} sm={10} md={6} lg={6} xl={6}>
        <Card style={{ height: "95%", width: "95%" }}>
          <CardContent>
            <Typography
              variant="h4"
              style={{ marginBottom: "16px", color: "#333" }}
            >
              Re-Processor Summary
            </Typography>
            <Typography style={{ marginBottom: "8px", fontWeight: "bold" }}>
              Selected Data Range:
            </Typography>
            <Typography style={{ marginBottom: "16px" }}>
              {data.reprocessFromDate} - {data.reprocessToDate}
            </Typography>
            <Typography style={{ marginBottom: "8px", fontWeight: "bold" }}>
              Number of Transactions:
            </Typography>
            <Typography style={{ marginBottom: "16px" }}>
              {data.numberOfTransactions}
            </Typography>
            <Typography style={{ marginBottom: "8px", fontWeight: "bold" }}>
              Resources to be Reprocessed:
            </Typography>
            <Typography style={{ marginBottom: "16px" }}>
              {data.resources.split(",").map((resource, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  style={{ marginRight: "8px", marginBottom: "8px" }}
                >
                  {resource.trim()}
                </Button>
              ))}
            </Typography>
            <Grid container justifyContent="flex-end" spacing={1}>
              <Grid item>
                <Button variant="contained" onClick={onBack}>
                  Back
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  onClick={handleReprocess}
                  color={success ? "success" : error ? "error" : "primary"}
                  disabled={success || data.numberOfTransactions === 0}
                  endIcon={
                    loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : success ? (
                      <CheckCircle style={{ color: "green" }} />
                    ) : error ? (
                      <ErrorRounded style={{ color: "red" }} />
                    ) : null
                  }
                >
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
