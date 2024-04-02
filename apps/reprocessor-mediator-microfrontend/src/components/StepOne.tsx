import { useState } from "react"
import { Grid, Typography, Button, TextField, MenuItem, Card, CardContent, Select, Checkbox, ListItemText, FormControl, InputLabel } from '@mui/material'

const availableResources = [
    { label: 'Care Plan', value: 'CarePlan' },
    { label: 'Condition', value: 'Condition' },
    { label: 'Encounter', value: 'Encounter' },
    { label: 'Episode Of Care', value: 'EpisodeOfCare' },
    { label: 'Patient', value: 'Patient' },
    { label: 'Related Person', value: 'RelatedPerson' },
    { label: 'Observation', value: 'Observation' }
]

function ReProcessorMain({ onNext, onCancel }) {
    const [method, setMethod] = useState('')
    const [resources, setResources] = useState([])
    const [reprocessFromDate, setReprocessFromDate] = useState('')
    const [reprocessToDate, setReprocessToDate] = useState('')

    const handleNext = async () => {
        const formattedFromDate = new Date(reprocessFromDate).toISOString()
        const formattedToDate = new Date(reprocessToDate).toISOString()

        try {
            const API_URL = process.env.REPROCESSOR_API_BASE_URL || 'http://localhost:3000/'
            const reprocessorSummaryEndPoint = API_URL + `reprocess/mongo?reprocessFromDate=${reprocessFromDate}&reprocessToDate=${reprocessToDate}&method=${method}&resources=${resources}`

            const response = await fetch(reprocessorSummaryEndPoint)
            if (!response.ok) {
                throw new Error('Failed to fetch data')
            }

            const data = await response.json()

            const numberOfTransactions = data.numberOfTransactions
            const numberOfFhirResources = data.numberOfFhirResources
            const resourcesToReprocess = data.resources

            onNext({ method, resources: resourcesToReprocess, reprocessFromDate: formattedFromDate, reprocessToDate: formattedToDate, numberOfTransactions })
        } catch (error) {
            console.error('Error fetching data:', error.message)
        }
    }

    const handleResourceChange = (event) => {
        const { value } = event.target

        if (value.includes('select-all')) {
            setResources(
                resources.length === availableResources.length ? [] : availableResources.map((resource) => resource.value)
            )
        } else {
            setResources(value)
        }
    }

    return (
        <Grid container justifyContent="center" alignItems="center">
            <Grid item xs={10} md={6} lg={6}>
                <Card>
                    <CardContent>
                        <Typography variant="h4" gutterBottom>
                            Re-Processor
                        </Typography>
                        <Grid container spacing={6}>
                            <Grid item xs={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Transaction Request Method"
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                >
                                    <MenuItem value="POST">Post</MenuItem>
                                    <MenuItem value="DELETE">Delete</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Transaction From Date"
                                    type="datetime-local"
                                    value={reprocessFromDate}
                                    onChange={(e) => setReprocessFromDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{ inputProps: { placeholder: '' } }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="resources-select-label">
                                        Resources to Process
                                    </InputLabel>
                                    <Select
                                        fullWidth
                                        labelId="resources-select-label"
                                        label="Resources to Process"
                                        multiple
                                        value={resources}
                                        onChange={handleResourceChange}
                                        renderValue={(selected) => (
                                            Array.isArray(selected) ? selected.join(', ') : selected
                                        )}
                                        inputProps={{
                                            id: 'resources-select-label'
                                        }}
                                    >
                                        <MenuItem
                                            key="select-all"
                                            value="select-all"
                                            onClick={() =>
                                                setResources(
                                                    resources.length === availableResources.length ? [] : availableResources.map((resource) => resource.value)
                                                )}
                                        >
                                            <Checkbox checked={resources.length === availableResources.length} />
                                            <ListItemText primary="Select All" />
                                        </MenuItem>
                                        {
                                            availableResources.map((resource) => {
                                                return (
                                                    <MenuItem key={resource.value} value={resource.value}>
                                                        <Checkbox checked={resources.includes(resource.value)} />
                                                        <ListItemText primary={resource.label} />
                                                    </MenuItem>
                                                )
                                            })}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Transaction To Date"
                                    type="datetime-local"
                                    value={reprocessToDate}
                                    onChange={(e) => setReprocessToDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{ inputProps: { placeholder: '' } }}
                                />
                            </Grid>
                        </Grid>
                        <Grid container justifyContent="space-between" style={{ marginTop: '16px' }}>
                            <Grid item>
                                <Button variant="contained" onClick={onCancel}>
                                    Cancel
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button variant="contained" color="primary" onClick={handleNext}>
                                    Next
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export default ReProcessorMain