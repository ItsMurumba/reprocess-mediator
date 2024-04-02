import { useState } from "react"
import {Grid, Typography, Button, TextField, MenuItem, Card, CardContent, Select, Checkbox, ListItemText, FormControl, InputLabel} from '@mui/material'

const availableResources = [
   { label: 'Care Plan', value: 'CarePlan'},
   { label: 'Condition', value: 'Condition'},
   { label: 'Encounter', value: 'Encounter'},
   { label: 'Episode Of Care', value: 'EpisodeOfCare'},
   { label: 'Patient', value: 'Patient'},
   { label: 'Related Person', value: 'RelatedPerson'},
   { label: 'Observation', value: 'Observation'}
]

function ReProcessorMain({onNext, onCancel}){
    const [method, setMethod] = useState('')
    const [resources, setResources] = useState([])
    const [reprocessFromDate, setReprocessFromDate] = useState('')
    const [reprocessToDate, setReprocessToDate] = useState('')

    const handleNext = () => {
        onNext({method, resources, reprocessFromDate, reprocessToDate})
    }

    const handleResourceChange = (event) => {
        const {value} = event.target

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
                        <MenuItem value="Post">Post</MenuItem>
                        <MenuItem value="Delete">Delete</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                        fullWidth
                        label="Transaction From Date"
                        type="date"
                        value={reprocessFromDate}
                        onChange={(e) => setReprocessFromDate(e.target.value)}
                        InputLabelProps={{shrink: true}}
                        InputProps={{inputProps: {placeholder: ''}}}
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
                        type="date"
                        value={reprocessToDate}
                        onChange={(e) => setReprocessToDate(e.target.value)}
                        InputLabelProps={{shrink: true}}
                        InputProps={{inputProps: {placeholder: ''}}}
                        />
                    </Grid>
                    </Grid>
                    <Grid container justifyContent="space-between" style={{marginTop: '16px'}}>
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