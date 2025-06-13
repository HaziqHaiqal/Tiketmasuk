"use client";

import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Id } from "@/convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStorageUrl } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Upload, X, Calendar, MapPin, DollarSign, Users } from "lucide-react";

const eventFormSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  price: z.number().min(0, "Price must be 0 or greater"),
  total_tickets: z.number().min(1, "Must have at least 1 ticket"),
  event_date: z
    .date()
    .refine((date) => date > new Date(), "Event date must be in the future"),
  is_published: z.boolean().default(false),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  mode: "create" | "edit";
  initialData?: {
    _id: Id<"events">;
    name: string;
    description: string;
    location: string;
    price: number;
    total_tickets: number;
    event_date: number;
    image_storage_id?: Id<"_storage">;
    is_published: boolean;
  };
  onSuccess?: () => void;
}

export default function EventForm({
  mode,
  initialData,
  onSuccess,
}: EventFormProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [removedCurrentImage, setRemovedCurrentImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentImageUrl = useStorageUrl(initialData?.image_storage_id);

  // Get user's vendor for creating events
  const vendor = useQuery(
    api.vendors.getByUserId,
    user?.id ? { user_id: user.id } : "skip"
  );

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const createEvent = useMutation(api.events.create);
  const updateEvent = useMutation(api.events.update);
  const deleteFile = useMutation(api.storage.deleteFile);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      location: initialData?.location || "",
      price: initialData?.price || 0,
      total_tickets: initialData?.total_tickets || 1,
      event_date: initialData ? new Date(initialData.event_date) : new Date(),
      is_published: initialData?.is_published || false,
    },
  });

  const watchedPublished = watch("is_published");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setRemovedCurrentImage(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    if (currentImageUrl) {
      setRemovedCurrentImage(true);
    }
  };

  const handleImageUpload = async (file: File): Promise<Id<"_storage">> => {
    const postUrl = await generateUploadUrl();
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();
    return storageId;
  };

  const onSubmit = async (values: EventFormData) => {
    setIsSubmitting(true);
    try {
      let image_storage_id = null;

      // Handle image upload
      if (selectedImage) {
        image_storage_id = await handleImageUpload(selectedImage);
      }

      // Delete old image if removed
      if (mode === "edit" && initialData?.image_storage_id) {
        if (removedCurrentImage || selectedImage) {
          await deleteFile({
            storageId: initialData.image_storage_id,
          });
        }
      }

      const eventData = {
        name: values.name,
        description: values.description,
        location: values.location,
        price: values.price,
        total_tickets: values.total_tickets,
        event_date: values.event_date.getTime(),
        is_published: values.is_published,
      };

      if (image_storage_id) {
        Object.assign(eventData, {
          image_storage_id: image_storage_id as Id<"_storage">,
        });
      }

      if (mode === "create") {
        if (!vendor) {
          throw new Error("Vendor not found. Please complete your vendor setup first.");
        }
        
        await createEvent({
          ...eventData,
          vendor_id: vendor._id,
        });
        toast({
          title: "Event created",
          description: "Your event has been created successfully.",
        });
      } else if (initialData) {
        if (image_storage_id || removedCurrentImage) {
          await updateEvent({
            event_id: initialData._id,
            updates: {
              ...eventData,
              image_storage_id: image_storage_id
                ? (image_storage_id as Id<"_storage">)
                : undefined,
            },
          });
        } else {
          await updateEvent({
            event_id: initialData._id,
            updates: eventData,
          });
        }
        toast({
          title: "Event updated",
          description: "Your event has been updated successfully.",
        });
      }

      onSuccess?.();
      if (mode === "create") {
        router.push("/organiser/events");
      }
    } catch (error) {
      console.error("Failed to save event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save event. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

     return (
     <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Event Image</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {imagePreview || (currentImageUrl && !removedCurrentImage) ? (
              <div className="relative">
                <Image
                  src={imagePreview || currentImageUrl || ""}
                  alt="Event preview"
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Click to upload an event image
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Event Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Event Name
          </Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Enter event name"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Describe your event"
            rows={4}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location
          </Label>
          <Input
            id="location"
            {...register("location")}
            placeholder="Event location"
            className={errors.location ? "border-red-500" : ""}
          />
          {errors.location && (
            <p className="text-sm text-red-500">{errors.location.message}</p>
          )}
        </div>

        {/* Price and Tickets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Price (RM)
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              {...register("price", { valueAsNumber: true })}
              placeholder="0.00"
              className={errors.price ? "border-red-500" : ""}
            />
            {errors.price && (
              <p className="text-sm text-red-500">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_tickets" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Tickets
            </Label>
            <Input
              id="total_tickets"
              type="number"
              min="1"
              {...register("total_tickets", { valueAsNumber: true })}
              placeholder="100"
              className={errors.total_tickets ? "border-red-500" : ""}
            />
            {errors.total_tickets && (
              <p className="text-sm text-red-500">{errors.total_tickets.message}</p>
            )}
          </div>
        </div>

        {/* Event Date */}
        <div className="space-y-2">
          <Label htmlFor="event_date">Event Date & Time</Label>
          <Input
            id="event_date"
            type="datetime-local"
            {...register("event_date", {
              valueAsDate: true,
              setValueAs: (value) => (value ? new Date(value) : undefined),
            })}
            className={errors.event_date ? "border-red-500" : ""}
          />
          {errors.event_date && (
            <p className="text-sm text-red-500">{errors.event_date.message}</p>
          )}
        </div>

        {/* Publish */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_published"
            checked={watchedPublished}
            onCheckedChange={(checked) =>
              setValue("is_published", checked === true)
            }
          />
          <Label htmlFor="is_published">Publish event (make it visible to public)</Label>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Create Event"
                : "Update Event"}
          </Button>
                 </div>
       </form>
   );
}
