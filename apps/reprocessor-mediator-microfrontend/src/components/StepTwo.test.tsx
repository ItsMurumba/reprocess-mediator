import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import SummaryScreen from "./StepTwo";

describe("SummaryScreen Component", () => {
  const data = {
    reprocessFromDate: "2024-03-19T09:06:52.051Z",
    reprocessToDate: "2024-03-19T09:13:23.226Z",
    numberOfTransactions: 10,
    resources: "Patient, Encounter",
    method: "POST",
  };

  test("renders component with initial state", () => {
    render(<SummaryScreen data={data} onBack={() => {}} onCancel={() => {}} />);
    expect(screen.getByText(/Re-Processor Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Selected Data Range/i)).toBeInTheDocument();
    expect(
      screen.getByText(`${data.reprocessFromDate} - ${data.reprocessToDate}`)
    ).toBeInTheDocument();
    expect(screen.getByText(/Number of Transactions/i)).toBeInTheDocument();
    expect(
      screen.getByText(`${data.numberOfTransactions}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Resources to be Reprocessed/i)
    ).toBeInTheDocument();
    expect(screen.getByText(`${data.resources}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Back/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Reprocess/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
  });

  test('clicking the "Reprocess" button triggers the correct API call', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    const handleBack = jest.fn();
    const handleCancel = jest.fn();

    render(
      <SummaryScreen data={data} onBack={handleBack} onCancel={handleCancel} />
    );

    fireEvent.click(screen.getByRole("button", { name: /Reprocess/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/reprocess/mongo"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reprocessFromDate: data.reprocessFromDate,
            reprocessToDate: data.reprocessToDate,
            method: data.method,
            resources: ["Patient", "Encounter"],
          }),
        })
      );
    });
  });

  test("handles successful reprocess request", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    const handleBack = jest.fn();
    const handleCancel = jest.fn();
    const consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    render(
      <SummaryScreen data={data} onBack={handleBack} onCancel={handleCancel} />
    );
    fireEvent.click(screen.getByRole("button", { name: /Reprocess/i }));

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith("Reprocess was successful");
    });

    consoleLogSpy.mockRestore();
  });

  test("handles failed reprocess request", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("Failed to perform the Reprocess Request"));
    const handleBack = jest.fn();
    const handleCancel = jest.fn();
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <SummaryScreen data={data} onBack={handleBack} onCancel={handleCancel} />
    );

    fireEvent.click(screen.getByRole("button", { name: /Reprocess/i }));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error encountered on reprocess POST Request:",
        "Failed to perform the Reprocess Request"
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
