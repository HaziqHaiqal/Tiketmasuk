"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import ImageUpload from "./ImageUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Camera, Store, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrganizerProfileImagesProps {
  organizerId: Id<"organizer_profiles">;
  currentImages?: {
    profileImageUrl?: string;
    storeLogoUrl?: string;
    storeBannerUrl?: string;
  };
  onImagesUpdated?: () => void;
}

export default function OrganizerProfileImages({
  organizerId,
  currentImages,
  onImagesUpdated,
}: OrganizerProfileImagesProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{
    profileImage?: File;
    storeLogo?: File;
    storeBanner?: File;
  }>({});

  // Convex mutations for image management
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const updateOrganizerImages = useMutation(api.organizers.updateImages);
  const deleteOrganizerImage = useMutation(api.organizers.deleteImage);

  const handleImageSelect = (type: "profileImage" | "storeLogo" | "storeBanner", file: File) => {
    setSelectedFiles(prev => ({
      ...prev,
      [type]: file,
    }));
  };

  const handleImageRemove = async (type: "profileImage" | "storeLogo" | "storeBanner") => {
    try {
      setIsUploading(true);
      
      await deleteOrganizerImage({
        profile_id: organizerId,
        image_type: type === "profileImage" ? "logo" : type === "storeLogo" ? "logo" : "banner",
      });

      setSelectedFiles(prev => ({
        ...prev,
        [type]: undefined,
      }));

      toast({
        title: "Image removed",
        description: "The image has been successfully removed.",
      });

      onImagesUpdated?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    // Get upload URL from Convex
    const uploadUrl = await generateUploadUrl();
    
    // Upload file to Convex storage
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!result.ok) {
      throw new Error("Failed to upload file");
    }

    const { storageId } = await result.json();
    return storageId;
  };

  const handleSaveImages = async () => {
    try {
      setIsUploading(true);
      
      const uploadPromises: Promise<{ type: string; storageId: string }>[] = [];

      // Upload selected files
      Object.entries(selectedFiles).forEach(([type, file]) => {
        if (file) {
          uploadPromises.push(
            uploadFile(file).then(storageId => ({ type, storageId }))
          );
        }
      });

      const uploadResults = await Promise.all(uploadPromises);

      // Update organizer profile with new image storage IDs
      const imageUpdates: Record<string, string> = {};
      uploadResults.forEach(({ type, storageId }) => {
        imageUpdates[type] = storageId;
      });

      if (Object.keys(imageUpdates).length > 0) {
        await updateOrganizerImages({
          profile_id: organizerId,
          logo_storage_id: (imageUpdates.storeLogo || imageUpdates.profileImage) as Id<"_storage">,
          banner_storage_id: imageUpdates.storeBanner as Id<"_storage">,
        });

        toast({
          title: "Images updated",
          description: "Your profile images have been successfully updated.",
        });

        // Clear selected files
        setSelectedFiles({});
        onImagesUpdated?.();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const hasChanges = Object.values(selectedFiles).some(file => file !== undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Profile Images
        </CardTitle>
        <CardDescription>
          Manage your profile picture, store logo, and banner image. These will be displayed on your events and store page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Image */}
        <ImageUpload
          label="Profile Picture"
          description="Your main profile picture (displayed as avatar)"
          currentImageUrl={currentImages?.profileImageUrl}
          onImageSelect={(file) => handleImageSelect("profileImage", file)}
          onImageRemove={() => handleImageRemove("profileImage")}
          aspectRatio="square"
          maxSize={5}
          disabled={isUploading}
        />

        {/* Store Logo */}
        <ImageUpload
          label="Store Logo"
          description="Your store/brand logo (displayed on events and products)"
          currentImageUrl={currentImages?.storeLogoUrl}
          onImageSelect={(file) => handleImageSelect("storeLogo", file)}
          onImageRemove={() => handleImageRemove("storeLogo")}
          aspectRatio="logo"
          maxSize={5}
          disabled={isUploading}
        />

        {/* Store Banner */}
        <ImageUpload
          label="Store Banner"
          description="Your store banner/cover image (displayed on your store page)"
          currentImageUrl={currentImages?.storeBannerUrl}
          onImageSelect={(file) => handleImageSelect("storeBanner", file)}
          onImageRemove={() => handleImageRemove("storeBanner")}
          aspectRatio="banner"
          maxSize={10}
          disabled={isUploading}
        />

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSaveImages}
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Images
                </>
              )}
            </Button>
          </div>
        )}

        {/* Usage Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <h4 className="font-medium text-blue-900 mb-2">Image Guidelines:</h4>
          <ul className="space-y-1 text-blue-800">
            <li>• <strong>Profile Picture:</strong> Square format, shows your face or brand identity</li>
            <li>• <strong>Store Logo:</strong> Clean, recognizable logo for events and products</li>
            <li>• <strong>Store Banner:</strong> Wide banner showcasing your brand or events</li>
            <li>• Use high-quality images for best results</li>
            <li>• Supported formats: JPG, PNG, WebP</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 