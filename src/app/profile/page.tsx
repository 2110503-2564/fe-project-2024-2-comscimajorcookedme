"use client";
import { CustomButton } from "@/components/CustomButton";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { BackendRoutes, FrontendRoutes } from "@/config/apiRoutes";
import { Role_type } from "@/config/role";
import { useUser } from "@/hooks/useUser";
import { User } from "@/types/user";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { LoaderCircleIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

const Page = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { user, loading, setUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});

  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      if (!user?._id || !session?.user.token) {
        throw new Error("User ID or token not available");
      }

      const response = await axios.put(
        `${BackendRoutes.UPDATE_USER}/${user._id}`,
        userData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.token}`,
          },
        },
      );

      return response.data;
    },
    onMutate: (newUserData) => {
      if (user) {
        const optimisticUser = { ...user, ...newUserData };
        setUser(optimisticUser);
      }
    },
    onSuccess: (data) => {
      setIsEditing(false);
      toast.success("Profile updated successfully!");
      if (user) {
        setUser({ ...user, ...data });
      }
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error((error as AxiosError).message || "Failed to update profile");
      if (user) {
        setUser(user);
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await signOut({ redirect: false, callbackUrl: "/" });
    },
    onSuccess: () => {
      setUser(null);
      router.push(FrontendRoutes.DENTIST_LIST);
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      router.push(FrontendRoutes.DENTIST_LIST);
    },
  });

  const handleLogout = () => {
    toast.promise(logoutMutation.mutateAsync(), {
      loading: "Logging out...",
      success: "Logged out successfully!",
      error: "Logout failed. Please try again.",
    });
  };

  const handleEditToggle = () => {
    if (!isEditing && user) {
      setFormData({
        name: user.name,
        email: user.email,
        tel: user.tel,
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    updateUserMutation.mutate(formData);
  };

  if (loading) {
    return (
      <div className="place-items-center pt-20">
        <Skeleton className="h-72 w-lg place-items-center pt-5 shadow-lg">
          <LoaderCircleIcon className="animate-spin" />
        </Skeleton>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="place-items-center pt-20">
        <Skeleton className="h-72 w-lg place-items-center pt-5 shadow-lg">
          <LoaderCircleIcon className="animate-spin" />
        </Skeleton>
      </div>
    );
  }

  return (
    <main className="space-y-10 px-10">
      <section className="flex w-full flex-col items-center justify-center pt-10">
        <p className="text-3xl font-semibold">Your Profile</p>
      </section>
      <section className="flex w-full justify-center">
        <Card className="w-lg max-w-full p-5 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-3 text-xl font-bold">
                <span>Profile Information</span>
                {user.role === Role_type.ADMIN && <Badge>Admin</Badge>}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 items-center gap-4">
              {isEditing ? (
                <>
                  <label className="block font-medium">Name</label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={updateUserMutation.isPending}
                    className="col-span-2"
                  />

                  <label className="block font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={updateUserMutation.isPending}
                    className="col-span-2"
                  />

                  <label className="block font-medium">Phone</label>
                  <Input
                    value={formData.tel || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, tel: e.target.value })
                    }
                    disabled={updateUserMutation.isPending}
                    className="col-span-2"
                  />
                </>
              ) : (
                <>
                  <strong>Name:</strong>{" "}
                  <span className="col-span-2">{user.name}</span>
                  <strong>Email:</strong>
                  <span className="col-span-2">{user.email} </span>
                  <strong>Phone:</strong>{" "}
                  <span className="col-span-2">{user.tel}</span>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">ID: {user._id}</p>
          </CardFooter>
        </Card>
      </section>
      <section className="flex w-full max-w-lg justify-end space-x-3 justify-self-center px-5">
        {isEditing ? (
          <>
            <CustomButton
              useFor="cancel"
              onClick={handleEditToggle}
              disabled={updateUserMutation.isPending}
            />
            <CustomButton
              useFor="confirm-info"
              onClick={handleSave}
              isLoading={updateUserMutation.isPending}
            />
          </>
        ) : (
          <CustomButton useFor="edit" onClick={handleEditToggle} />
        )}
        <CustomButton
          useFor="logout"
          hideTextOnMobile={false}
          className="shadow-3xl"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        />
      </section>
    </main>
  );
};

export default Page;
