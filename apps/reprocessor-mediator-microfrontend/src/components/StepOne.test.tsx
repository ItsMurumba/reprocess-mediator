import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import ReProcessorMain from "./StepOne";

describe("ReProcessorMain Component", () => {
  const onNextMock = jest.fn();
  const onCancelMock = jest.fn();

  test("Next button is disabled when required fields are empty", () => {
    render(<ReProcessorMain onNext={onNextMock} onCancel={onCancelMock} />);
    const nextButton = screen.getByRole("button", { name: /Next/i });
    expect(nextButton).toBeDisabled();
  });

  test("Next button is enabled when required fields are filled", async () => {
    render(<ReProcessorMain onNext={onNextMock} onCancel={onCancelMock} />);

    const fromDateSelected = screen.getByLabelText(/Transaction From Date/i);
    const toDateSelected = screen.getByLabelText(/Transaction To Date/i);

    const methodDropdown = screen.getByLabelText(/Transaction Request Method/i);
    fireEvent.mouseDown(methodDropdown);
    const postOption = screen.getByText(/Post/i);
    fireEvent.click(postOption);
    const methodSelected = screen.getByDisplayValue(/Post/i);

    const select = screen.getByLabelText(/Resources to Process/i);
    fireEvent.mouseDown(select);
    const selectAllOption = screen.getByText(/Patient/i);
    fireEvent.click(selectAllOption);
    const resources = screen.getByDisplayValue(/Patient/i);

    fireEvent.change(methodSelected, { target: { value: "POST" } });
    fireEvent.change(fromDateSelected, {
      target: { value: "2024-04-01T12:00" },
    });
    fireEvent.change(toDateSelected, { target: { value: "2024-04-08T12:00" } });
    fireEvent.change(resources, { target: { value: "Patient" } });

    const nextButton = screen.getByText(/Next/i, { selector: "button" });

    await waitFor(() => expect(nextButton).not.toBeDisabled());
  });

  test("Clicking Cancel button calls onCancel function", () => {
    render(<ReProcessorMain onNext={onNextMock} onCancel={onCancelMock} />);
    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelButton);
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  test("Select All checkbox selects all resources", async () => {
    render(<ReProcessorMain onNext={onNextMock} onCancel={onCancelMock} />);
    const select = screen.getByLabelText(/Resources to Process/i);

    fireEvent.mouseDown(select);

    const selectAllOption = screen.getByText(/Select All/i);
    fireEvent.click(selectAllOption);

    const resources = screen.getAllByRole("option", { selected: true });
    expect(resources.length).toBe(7);
  });
});
