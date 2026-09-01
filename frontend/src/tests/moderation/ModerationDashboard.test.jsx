import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ModerationDashboardPage from "../../pages/moderation/ModerationDashboardPage";
import {
  flaggedItemFixture,
  moderationUserFixture,
} from "../helpers";

vi.mock("../../services/moderationApi", () => ({
  fetchFlaggedQueue: vi.fn(),
  fetchModerationUsers: vi.fn(),
  banUser: vi.fn(),
  unbanUser: vi.fn(),
  setContentVisibility: vi.fn(),
  resolveContent: vi.fn(),
}));

import {
  banUser,
  fetchFlaggedQueue,
  fetchModerationUsers,
  resolveContent,
  setContentVisibility,
  unbanUser,
} from "../../services/moderationApi";

function renderPage() {
  return render(
    <MemoryRouter>
      <ModerationDashboardPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchFlaggedQueue.mockResolvedValue([
    flaggedItemFixture(),
    flaggedItemFixture({
      id: "cm7",
      type: "comment",
      title: "Comment on discussion d2",
      excerpt: "Totally unrelated promo link here, sorry.",
      reason: "Off-topic",
    }),
  ]);
  fetchModerationUsers.mockResolvedValue([
    moderationUserFixture(),
    moderationUserFixture({ id: "u2", name: "Priya Nair", username: "priya", banned: true }),
    moderationUserFixture({ id: "u3", name: "Rahul Verma", username: "rahul", role: "Instructor" }),
  ]);
});

describe("ModerationDashboard (Phase 8)", () => {
  it("loads and renders the flagged queue with reasons", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Spam \/ advertising/i)).toBeInTheDocument();
      expect(screen.getByText("Off-topic")).toBeInTheDocument();
    });
    expect(screen.getByText(/Flagged content \(2\)/)).toBeInTheDocument();
  });

  it("hides content and shows a confirmation toast", async () => {
    setContentVisibility.mockResolvedValue({ id: "d5", type: "discussion", hidden: true });
    renderPage();

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Hide content" }).length).toBeGreaterThan(0)
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Hide content" })[0]);

    await waitFor(() => {
      const toast = document.querySelector('[data-notification-id]');
      expect(toast).toHaveTextContent("Discussion is now hidden");
    });
    expect(setContentVisibility).toHaveBeenCalledWith("d5", "discussion", true);
  });

  it("resolves items and removes them from the queue", async () => {
    resolveContent.mockResolvedValue({ id: "d5", type: "discussion", resolved: true });
    renderPage();

    await waitFor(() => expect(screen.getAllByText("Resolve").length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole("button", { name: "Resolve" })[0]);

    await waitFor(() => {
      expect(screen.getByText(/Flagged content \(1\)/)).toBeInTheDocument();
    });
    expect(resolveContent).toHaveBeenCalledWith("d5", "discussion");
  });

  it("bans and unbans members via the user table", async () => {
    banUser.mockResolvedValue(moderationUserFixture({ banned: true }));
    renderPage();

    await waitFor(() => expect(screen.getByText("@priya")).toBeInTheDocument());

    // Ban an active user.
    fireEvent.click(screen.getAllByRole("button", { name: "Ban" })[0]);
    await waitFor(() => expect(banUser).toHaveBeenCalledWith("u7"));

    // Unban a previously banned user (scoped to Priya's row — Dev was just
    // banned above, so more than one Unban button exists at this point).
    unbanUser.mockResolvedValue(moderationUserFixture({ id: "u2", banned: false }));
    const priyaRow = document.querySelector('[data-user-id="u2"]');
    fireEvent.click(within(priyaRow).getByRole("button", { name: "Unban" }));
    await waitFor(() => expect(unbanUser).toHaveBeenCalledWith("u2"));
  });

  it("renders the rich text editor with preview toggle", async () => {
    renderPage();

    await waitFor(() => expect(screen.getByTestId("rich-text-editor")).toBeInTheDocument());
    expect(screen.getByDisplayValue(/Keep the community friendly/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    const preview = screen.getByTestId("rich-preview");
    expect(preview.innerHTML).toContain("<strong>Notice:</strong>");
    expect(screen.queryByDisplayValue(/Keep the community friendly/)).not.toBeInTheDocument();
  });

  it("shows an error banner when loading fails", async () => {
    fetchFlaggedQueue.mockRejectedValue(new Error("Backend offline"));
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Failed to load moderation data");
    });
  });
});
