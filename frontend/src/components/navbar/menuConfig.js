import { isOwnerProfileIncomplete } from "../../utils/auth";

export function getNavbarConfig({ user, role, ownerListingCounts, badgeState }) {
  if (!user) {
    return {
      direct: [
        { label: "About Us", path: "/about" },
        { label: "Adopt", path: "/adopt" }
      ],
      menu: []
    };
  }

  if (role === "ADMIN") {
    return {
      direct: [{ label: "Moderation", path: "/adminhomepage" }],
      menu: [
        { label: "Moderation dashboard", path: "/adminhomepage" },
        { label: "Edit profile", path: "/account" }
      ]
    };
  }

  if (role === "OWNER") {
    const menu = [];
    if (isOwnerProfileIncomplete(user)) {
      menu.push({ label: "Complete profile", path: "/complete-owner-profile" });
    }
    menu.push(
      {
        label: "Archived listings",
        path: "/owner-listings?tab=archived",
        count: ownerListingCounts.archived
      },
      {
        label: "Adopted animals",
        path: "/owner-listings?tab=adopted",
        count: ownerListingCounts.adopted
      },
      { label: "Edit profile", path: "/account" }
    );
    return {
      direct: [
        { label: "Listed animals", path: "/owner-listings" },
        { label: "Register animal", path: "/register-animal" },
        { label: "Manage requests", path: "/owner-requests" },
        {
          label: "Messages",
          path: "/owner-messages",
          attentionCount: badgeState.ownerUnreadMessages
        }
      ],
      menu
    };
  }

  const adopterMenu = [];
  if (user.adopterProfileCompleted === false) {
    adopterMenu.push({ label: "Complete profile", path: "/complete-adopter-profile" });
  }
  adopterMenu.push(
    { label: "Home", path: "/adopterhomepage" },
    { label: "My adoptions", path: "/my-adoptions" },
    { label: "Edit profile", path: "/account" }
  );
  return {
    direct: [
      { label: "Adoption request", path: "/adoption-request" },
      { label: "My adoption requests", path: "/my-adoption-requests" },
      { label: "Saved animals", path: "/saved-animals" },
      {
        label: "Messages",
        path: "/adopter-messages",
        attentionCount: badgeState.adopterUnreadMessages
      }
    ],
    menu: adopterMenu
  };
}
