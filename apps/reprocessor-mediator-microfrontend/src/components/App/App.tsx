import React, { useState } from "react";
import ReProcessorMain from "../StepOne";
import SummaryScreen from "../StepTwo";

function App() {
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState(null)

    const handleNext = (data) => {
        setFormData(data)
        setStep(2)
    }

    const handleBack = () => {
        setStep(1)
    }

    const handleReprocess = () => {
        setStep(1)
    }

    const handleCancel = () => {
        setFormData(null)
        setStep(1)
    }

    return (
        <div>
            {step === 1 && <ReProcessorMain onNext={handleNext} onCancel={handleCancel} />}
            {step === 2 && <SummaryScreen data={formData} onBack={handleBack} onCancel={handleCancel} />}
        </div>
    );
}

export default App;