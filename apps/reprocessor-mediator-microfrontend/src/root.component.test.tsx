import { render, waitFor } from "@testing-library/react";
import Root from "./root.component";
import React from "react";

test("App is mounted inside Root component", async () => {
  const { getByTestId } = render(<Root />);
  await waitFor(() => {
    const appComponent = getByTestId("app-component");
    expect(appComponent).toBeInTheDocument();
  });
});
