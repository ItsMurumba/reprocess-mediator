import { SnackbarProvider } from "notistack";
import App from "./components/App/App";

export default function Root(props) {
  return (
    <>
      <div data-testid="app-component">
        <App />
        <SnackbarProvider />
      </div>
    </>
  );
}
