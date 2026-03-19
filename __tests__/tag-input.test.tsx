import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagInput } from "@/components/tag-input";

function setup(tags: string[] = [], onTagsChange = jest.fn()) {
  const utils = render(<TagInput tags={tags} onTagsChange={onTagsChange} />);
  const input = screen.getByRole("textbox");
  return { ...utils, input, onTagsChange };
}

describe("TagInput", () => {
  describe("adding tags", () => {
    it("should add a tag when Enter is pressed", async () => {
      const onTagsChange = jest.fn();
      const { input } = setup([], onTagsChange);

      await userEvent.type(input, "work{enter}");

      expect(onTagsChange).toHaveBeenCalledWith(["work"]);
    });

    it("should trim whitespace before adding a tag", async () => {
      const onTagsChange = jest.fn();
      const { input } = setup([], onTagsChange);

      await userEvent.type(input, "  urgent  {enter}");

      expect(onTagsChange).toHaveBeenCalledWith(["urgent"]);
    });

    it("should add a tag on blur when the input has content", async () => {
      const onTagsChange = jest.fn();
      const { input } = setup([], onTagsChange);

      await userEvent.type(input, "personal");
      fireEvent.blur(input);

      expect(onTagsChange).toHaveBeenCalledWith(["personal"]);
    });

    it("should clear the input after a tag is added via Enter", async () => {
      const onTagsChange = jest.fn();
      const { input } = setup([], onTagsChange);

      await userEvent.type(input, "work{enter}");

      expect(input).toHaveValue("");
    });
  });

  describe("duplicate prevention", () => {
    it("should not add a tag that already exists", async () => {
      const onTagsChange = jest.fn();
      const { input } = setup(["work"], onTagsChange);

      await userEvent.type(input, "work{enter}");

      expect(onTagsChange).not.toHaveBeenCalled();
    });

    it("should not add an empty tag when Enter is pressed", async () => {
      const onTagsChange = jest.fn();
      const { input } = setup([], onTagsChange);

      await userEvent.type(input, "{enter}");

      expect(onTagsChange).not.toHaveBeenCalled();
    });

    it("should not add a whitespace-only tag", async () => {
      const onTagsChange = jest.fn();
      const { input } = setup([], onTagsChange);

      await userEvent.type(input, "   {enter}");

      expect(onTagsChange).not.toHaveBeenCalled();
    });
  });

  describe("removing tags", () => {
    it("should remove a tag when its X button is clicked", async () => {
      const onTagsChange = jest.fn();
      setup(["work", "personal"], onTagsChange);

      const removeButtons = screen.getAllByRole("button");
      await userEvent.click(removeButtons[0]); // first tag's X

      expect(onTagsChange).toHaveBeenCalledWith(["personal"]);
    });

    it("should remove the last tag when Backspace is pressed on an empty input", async () => {
      const onTagsChange = jest.fn();
      const { input } = setup(["work", "personal"], onTagsChange);

      await userEvent.click(input);
      await userEvent.keyboard("{Backspace}");

      expect(onTagsChange).toHaveBeenCalledWith(["work"]);
    });

    it("should not remove any tag when Backspace is pressed with input content present", async () => {
      const onTagsChange = jest.fn();
      const { input } = setup(["work"], onTagsChange);

      await userEvent.type(input, "t{Backspace}");

      expect(onTagsChange).not.toHaveBeenCalled();
    });
  });

  describe("rendering", () => {
    it("should render all existing tags", () => {
      setup(["work", "personal", "urgent"]);

      expect(screen.getByText("work")).toBeInTheDocument();
      expect(screen.getByText("personal")).toBeInTheDocument();
      expect(screen.getByText("urgent")).toBeInTheDocument();
    });

    it("should show placeholder text when no tags exist", () => {
      const { input } = setup([]);
      expect(input).toHaveAttribute("placeholder", "Add tags (press Enter)");
    });

    it("should clear placeholder when at least one tag exists", () => {
      const { input } = setup(["work"]);
      expect(input).toHaveAttribute("placeholder", "");
    });
  });
});
