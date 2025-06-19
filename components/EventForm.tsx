"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, MapPin } from "lucide-react";
import Spinner from "./Spinner";

const eventFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  start_datetime: z.date(),
  end_datetime: z.date().optional(),
  event_category: z.enum([
    "sports", "music", "food", "travel", "technology", 
    "arts", "business", "education", "health", "entertainment"
  ]),
  location_type: z.enum(["physical", "online", "hybrid"]).default("physical"),
  is_free: z.boolean().default(false),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  mode: "create" | "edit";
  initialData?: {
    _id: Id<"events">;
    title: string;
    description: string;
    start_datetime: number;
    end_datetime?: number;
    event_category?: "sports" | "music" | "food" | "travel" | "technology" | "arts" | "business" | "education" | "health" | "entertainment";
    location_type: "physical" | "online" | "hybrid";
    is_free: boolean;
  };
  onFormSubmit?: () => void;
}

export default function EventForm({ mode, initialData, onFormSubmit }: EventFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useConvexAuth();

  // Get organizer profile
  const organizerProfile = useQuery(
    api.users.getOrganizerProfile,
    isAuthenticated ? {} : "skip"
  );

  const createEvent = useMutation(api.events.create);
  const updateEvent = useMutation(api.events.update);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      start_datetime: initialData ? new Date(initialData.start_datetime) : new Date(),
      end_datetime: initialData?.end_datetime ? new Date(initialData.end_datetime) : undefined,
      event_category: initialData?.event_category,
      location_type: initialData?.location_type,
      is_free: initialData?.is_free || false,
    },
  });

  const onSubmit = async (values: EventFormData) => {
    if (!isAuthenticated || !organizerProfile) {
      toast({
        title: "Error",
        description: "You must be logged in with an organizer profile to create events.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const eventData = {
        title: values.title,
        description: values.description,
        start_datetime: values.start_datetime.getTime(),
        end_datetime: values.end_datetime?.getTime(),
        event_category: values.event_category,
        location_type: values.location_type,
        is_free: values.is_free,
        timezone: typeof window !== 'undefined' 
          ? Intl.DateTimeFormat().resolvedOptions().timeZone 
          : "Asia/Kuala_Lumpur",
        organizer_id: organizerProfile._id,
      };

      let eventId: Id<"events">;

      if (mode === "edit" && initialData) {
        await updateEvent({
          event_id: initialData._id,
          ...eventData,
        });
        eventId = initialData._id;
        toast({
          title: "Success",
          description: "Event updated successfully",
        });
      } else {
        eventId = await createEvent(eventData);
        toast({
          title: "Success", 
          description: "Event created successfully",
        });
      }

      // Navigate to the event or call success callback
      if (onFormSubmit) {
        onFormSubmit();
      } else {
        router.push(`/events/${eventId}`);
      }
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description: "Failed to save event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <p>Please log in to create events.</p>
        </CardContent>
      </Card>
    );
  }

  if (!organizerProfile) {
    return <Spinner fullScreen />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your event" 
                        className="min-h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_datetime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date & Time *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={field.value ? field.value.toISOString().slice(0, 16) : ""}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_datetime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date & Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={field.value ? field.value.toISOString().slice(0, 16) : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="event_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="arts">Arts</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="health">Health</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="physical">Physical Location</SelectItem>
                          <SelectItem value="online">Online Event</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "edit" ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 