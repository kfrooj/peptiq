import { Suspense } from "react";
import ProfileContent from "@/components/profile/ProfileContent";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}