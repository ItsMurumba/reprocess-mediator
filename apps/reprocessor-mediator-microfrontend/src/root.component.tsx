import App from "./components/App/App";

export default function Root(props) {
  return (
    <>
      <div data-testid="app-component">
        <App />
      </div>
    </>
  );
}
