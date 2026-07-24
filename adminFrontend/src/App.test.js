import { render, screen } from "@testing-library/react";
import Spinner from "./component/Spinner";

test("renders a loading indicator", () => {
  render(<Spinner />);
  expect(screen.getByRole("status")).toBeInTheDocument();
});
