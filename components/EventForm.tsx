"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Plus, Trash2, Upload, X, Hash, ArrowRight, Ticket, Settings, Package, AlertCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Image from "next/image";
import { useConvexAuth } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useStorageUrl } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

import { 
  CheckCircle2, ChevronDown, ChevronUp, DollarSign, Eye, FileText, Infinity, MapPin, ShoppingBag, Shirt, Timer, Users
} from "lucide-react";

// Enhanced schema for the new category-based system
const pricingTierSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tier name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be 0 or greater"),
  availability_type: z.enum(["time_based", "quantity_based", "unlimited"]),
  sale_start_date: z.date().optional(),
  sale_end_date: z.date().optional(),
  max_tickets: z.number().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number(),
});

const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  total_tickets: z.number().min(1, "Must have at least 1 ticket"),
  is_active: z.boolean().default(true),
  pricing_tiers: z.array(pricingTierSchema).min(1, "Must have at least 1 pricing tier"),
  sort_order: z.number(),
});

const eventFormSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(1, "Location is required"),
  event_date: z.date().refine((date) => date > new Date(), "Event date must be in the future"),
  categories: z.array(categorySchema).min(1, "Must have at least 1 category"),
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
    event_date: number;
    categories: Array<{
      id: string;
      name: string;
      description?: string;
      total_tickets: number;
      available_tickets: number;
      is_active: boolean;
      pricing_tiers: Array<{
        id: string;
        name: string;
        description?: string;
        price: number;
        availability_type: "time_based" | "quantity_based" | "unlimited";
        sale_start_date?: number;
        sale_end_date?: number;
        max_tickets?: number;
        tickets_sold?: number;
        is_active: boolean;
        sort_order: number;
      }>;
      sort_order: number;
    }>;
    image_storage_id?: Id<"_storage">;
    is_published: boolean;
  };
  onSuccess?: () => void;
}

export default function EventForm({ mode, initialData, onSuccess }: EventFormProps) {
  const { isAuthenticated } = useConvexAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [removedCurrentImage, setRemovedCurrentImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<Array<{
    id: string;
    name: string;
    description: string;
    base_price: number;
    category: string;
    product_type: "event-essential" | "merchandise";
    variants: Array<{
      id: string;
      name: string;
      options: Array<{
        id: string;
        label: string;
        price_modifier?: number;
        quantity: number;
        available_quantity: number;
        is_available: boolean;
      }>;
      is_required: boolean;
    }>;
    default_quantity?: number;
    max_quantity_per_ticket?: number;
    image_storage_id?: Id<"_storage">;
  }>>([]);

  const currentImageUrl = useStorageUrl(initialData?.image_storage_id);

  // Get user's organizer profile for creating events
  const organizerProfile = useQuery(
    api.users.getOrganizerProfile,
    isAuthenticated ? {} : "skip" // Backend will use ctx.auth.getUserIdentity()
  );

  const createEvent = useMutation(api.events.create);
  const updateEvent = useMutation(api.events.update);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const deleteFile = useMutation(api.storage.deleteFile);
  const createProduct = useMutation(api.products.createProduct);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      location: initialData?.location || "",
      event_date: initialData ? new Date(initialData.event_date) : new Date(),
      categories: initialData?.categories 
        ? initialData.categories.map(cat => ({
            ...cat,
            pricing_tiers: cat.pricing_tiers.map(tier => ({
              ...tier,
              price: tier.price / 100, // Convert from cents to dollars
              sale_start_date: tier.sale_start_date ? new Date(tier.sale_start_date) : undefined,
              sale_end_date: tier.sale_end_date ? new Date(tier.sale_end_date) : undefined,
            }))
          }))
        : [],
      is_published: initialData?.is_published || false,
    },
  });

  const { fields: categoryFields, append: appendCategory, remove: removeCategory } = useFieldArray({
    control: form.control,
    name: "categories"
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Image must be less than 5MB",
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload an image file",
        });
        return;
      }

      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setRemovedCurrentImage(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    setRemovedCurrentImage(true);
  };

  const handleImageUpload = async (file: File): Promise<Id<"_storage">> => {
    const uploadUrl = await generateUploadUrl();
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();
    return storageId;
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addCategory = () => {
    const newCategory = {
      id: generateId(),
      name: "",
      description: "",
      total_tickets: 100,
      is_active: true,
      sort_order: categoryFields.length,
      pricing_tiers: [{
        id: generateId(),
        name: "Standard",
        description: "",
        price: 50,
        availability_type: "unlimited" as const,
        is_active: true,
        sort_order: 0,
      }]
    };
    appendCategory(newCategory);
  };

  const addPricingTier = (categoryIndex: number) => {
    const currentCategory = form.getValues(`categories.${categoryIndex}`);
    const newTier = {
      id: generateId(),
      name: "",
      description: "",
      price: 50,
      availability_type: "unlimited" as const,
      is_active: true,
      sort_order: currentCategory.pricing_tiers.length,
    };
    form.setValue(`categories.${categoryIndex}.pricing_tiers`, [...currentCategory.pricing_tiers, newTier]);
  };

  const removePricingTier = (categoryIndex: number, tierIndex: number) => {
    const currentCategory = form.getValues(`categories.${categoryIndex}`);
    if (currentCategory.pricing_tiers.length > 1) {
      const updatedTiers = currentCategory.pricing_tiers.filter((_, index) => index !== tierIndex);
      form.setValue(`categories.${categoryIndex}.pricing_tiers`, updatedTiers);
    } else {
      toast({
        variant: "destructive",
        title: "Cannot remove tier",
        description: "Each category must have at least one pricing tier",
      });
    }
  };

  const toggleCategoryCollapse = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Product management functions
  const generateProductId = () => Math.random().toString(36).substr(2, 9);

  const addProduct = () => {
    const newProduct = {
      id: generateProductId(),
      name: "",
      description: "",
      base_price: 0,
      category: "",
      product_type: "event-essential" as const,
      variants: [{
        id: generateProductId(),
        name: "Size",
        options: [{
          id: generateProductId(),
          label: "One Size",
          price_modifier: 0,
          quantity: 100,
          available_quantity: 100,
          is_available: true,
        }],
        is_required: true,
      }],
      default_quantity: 1,
      max_quantity_per_ticket: 5,
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const removeProduct = (productIndex: number) => {
    setProducts(prev => prev.filter((_, index) => index !== productIndex));
  };

  const updateProduct = (productIndex: number, updates: Partial<typeof products[0]>) => {
    setProducts(prev => prev.map((product, index) => 
      index === productIndex ? { ...product, ...updates } : product
    ));
  };

  const addVariant = (productIndex: number) => {
    const newVariant = {
      id: generateProductId(),
      name: "",
      options: [{
        id: generateProductId(),
        label: "",
        price_modifier: 0,
        quantity: 100,
        available_quantity: 100,
        is_available: true,
      }],
      is_required: false,
    };
    
    setProducts(prev => prev.map((product, index) => 
      index === productIndex 
        ? { ...product, variants: [...product.variants, newVariant] }
        : product
    ));
  };

  const removeVariant = (productIndex: number, variantIndex: number) => {
    setProducts(prev => prev.map((product, index) => 
      index === productIndex 
        ? { ...product, variants: product.variants.filter((_, vIndex) => vIndex !== variantIndex) }
        : product
    ));
  };

  const addVariantOption = (productIndex: number, variantIndex: number) => {
    const newOption = {
      id: generateProductId(),
      label: "",
      price_modifier: 0,
      quantity: 100,
      available_quantity: 100,
      is_available: true,
    };

    setProducts(prev => prev.map((product, pIndex) => 
      pIndex === productIndex 
        ? {
            ...product,
            variants: product.variants.map((variant, vIndex) =>
              vIndex === variantIndex
                ? { ...variant, options: [...variant.options, newOption] }
                : variant
            )
          }
        : product
    ));
  };

  const removeVariantOption = (productIndex: number, variantIndex: number, optionIndex: number) => {
    setProducts(prev => prev.map((product, pIndex) => 
      pIndex === productIndex 
        ? {
            ...product,
            variants: product.variants.map((variant, vIndex) =>
              vIndex === variantIndex
                ? { ...variant, options: variant.options.filter((_, oIndex) => oIndex !== optionIndex) }
                : variant
            )
          }
        : product
    ));
  };

  const onSubmit = async (values: EventFormData) => {
    if (!isAuthenticated) return;

    setIsSubmitting(true);
    try {
      let imageStorageId = initialData?.image_storage_id;

      // Handle image upload/deletion
      if (selectedImage) {
        // Delete old image if exists
        if (initialData?.image_storage_id) {
          try {
            await deleteFile({ storageId: initialData.image_storage_id });
          } catch (error) {
            console.warn("Failed to delete old image:", error);
          }
        }
        // Upload new image
        imageStorageId = await handleImageUpload(selectedImage);
      } else if (removedCurrentImage && initialData?.image_storage_id) {
        // Delete image if removed
        try {
          await deleteFile({ storageId: initialData.image_storage_id });
        } catch (error) {
          console.warn("Failed to delete image:", error);
        }
        imageStorageId = undefined;
      }

      // Prepare categories with converted prices (dollars to cents)
      const processedCategories = values.categories.map(category => ({
        ...category,
        description: category.description || "", // Ensure description is always a string
        available_tickets: category.total_tickets, // Set available tickets to total tickets initially
        pricing_tiers: category.pricing_tiers.map(tier => ({
          ...tier,
          description: tier.description || "", // Ensure tier description is always a string
          price: Math.round(tier.price * 100), // Convert to cents
          sale_start_date: tier.sale_start_date?.getTime(),
          sale_end_date: tier.sale_end_date?.getTime(),
        }))
      }));

      const eventData = {
        name: values.name,
        description: values.description,
        location: values.location,
        event_date: values.event_date.getTime(),
        categories: processedCategories,
        image_storage_id: imageStorageId,
        is_published: values.is_published,
      };

      if (mode === "create") {
        await createEvent({
          ...eventData,
          organizer_id: organizerProfile!._id,
        });
        toast({
          title: "Event created successfully!",
          description: "Your event has been created and is ready for ticket sales.",
        });
      } else {
        await updateEvent({
          event_id: initialData!._id,
          updates: eventData,
        });
        toast({
          title: "Event updated successfully!",
          description: "Your changes have been saved.",
        });
      }

      // Create products if any exist
      if (products.length > 0 && mode === "create") {
        for (const product of products) {
          if (product.name && product.base_price > 0) {
            try {
              await createProduct({
                organizer_id: organizerProfile!._id,
                event_id: eventData.is_published ? undefined : undefined, // Link to event if needed
                name: product.name,
                description: product.description,
                base_price: Math.round(product.base_price * 100), // Convert to cents
                category: product.category,
                product_type: product.product_type,
                                  variants: product.variants.map(variant => ({
                    ...variant,
                    options: variant.options.map(option => ({
                      ...option,
                      price_modifier: option.price_modifier || 0,
                    }))
                  })),
                  default_quantity: product.default_quantity || 1,
                  max_quantity_per_ticket: product.max_quantity_per_ticket || 5,
                image_storage_id: product.image_storage_id,
              });
            } catch (error) {
              console.warn("Failed to create product:", product.name, error);
            }
          }
        }
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: mode === "create" ? "Failed to create event" : "Failed to update event",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const CategoryPricingTiers = ({ categoryIndex }: { categoryIndex: number }) => {
    const category = form.watch(`categories.${categoryIndex}`);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Pricing Tiers</h4>
              <p className="text-sm text-gray-500">Different price points for this category</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => addPricingTier(categoryIndex)}
            className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl px-4 py-2 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Tier
          </Button>
        </div>

        <div className="space-y-4">
          {category.pricing_tiers.map((tier, tierIndex) => (
            <div key={tier.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {tierIndex + 1}
                  </span>
                  <span className="font-medium text-gray-900">Pricing Tier {tierIndex + 1}</span>
                </div>
                {category.pricing_tiers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePricingTier(categoryIndex, tierIndex)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-8 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name={`categories.${categoryIndex}.pricing_tiers.${tierIndex}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-gray-900">Tier Name *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., Early Bird, Regular"
                            className="h-12 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`categories.${categoryIndex}.pricing_tiers.${tierIndex}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-gray-900">Price (RM) *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">RM</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="h-12 pl-12 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0.00"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`categories.${categoryIndex}.pricing_tiers.${tierIndex}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-900">Description (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="What makes this tier special?"
                          className="h-12 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`categories.${categoryIndex}.pricing_tiers.${tierIndex}.availability_type`}
                  render={({ field }) => (
                    <FormItem className="mb-8">
                      <FormLabel className="font-medium text-gray-900">Availability Type</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-12 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <SelectValue placeholder="Choose availability type" />
                          </SelectTrigger>
                          <SelectContent 
                            className="rounded-xl border-gray-200 z-50" 
                            position="popper"
                            sideOffset={5}
                          >
                            <SelectItem value="unlimited" className="rounded-lg focus:bg-blue-50">
                              <div className="flex items-center gap-3 py-2">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Infinity className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium">Always Available</p>
                                  <p className="text-xs text-gray-500">No time or quantity limits</p>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="time_based" className="rounded-lg focus:bg-blue-50">
                              <div className="flex items-center gap-3 py-2">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Timer className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium">Time-Limited</p>
                                  <p className="text-xs text-gray-500">Available during specific dates</p>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="quantity_based" className="rounded-lg focus:bg-blue-50">
                              <div className="flex items-center gap-3 py-2">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Hash className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium">Limited Quantity</p>
                                  <p className="text-xs text-gray-500">Fixed number available</p>
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {tier.availability_type === "time_based" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Timer className="w-5 h-5 text-blue-600" />
                      <h5 className="font-semibold text-blue-900">Time-Based Settings</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name={`categories.${categoryIndex}.pricing_tiers.${tierIndex}.sale_start_date`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium text-blue-900">Sale Start Date & Time</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                {...field}
                                value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                className="h-12 bg-white border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`categories.${categoryIndex}.pricing_tiers.${tierIndex}.sale_end_date`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-medium text-blue-900">Sale End Date & Time</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                {...field}
                                value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                className="h-12 bg-white border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {tier.availability_type === "quantity_based" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Hash className="w-5 h-5 text-blue-600" />
                      <h5 className="font-semibold text-blue-900">Quantity Limit</h5>
                    </div>
                    <FormField
                      control={form.control}
                      name={`categories.${categoryIndex}.pricing_tiers.${tierIndex}.max_tickets`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium text-blue-900">Maximum Tickets for this Tier</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              className="h-12 bg-white border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name={`categories.${categoryIndex}.pricing_tiers.${tierIndex}.is_active`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 bg-white rounded-xl p-4 border border-gray-200">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                      </FormControl>
                      <FormLabel className="font-medium text-gray-900 cursor-pointer">
                        Make this pricing tier available for purchase
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const steps = [
    { number: 1, title: "Event Info", icon: FileText, completed: !!form.watch("name") && !!form.watch("description") && !!form.watch("location") && !!form.watch("event_date") },
    { number: 2, title: "Tickets & Pricing", icon: Ticket, completed: categoryFields.length > 0 && categoryFields.every(cat => cat.name && cat.total_tickets > 0) },
    { number: 3, title: "Products (Optional)", icon: Package, completed: true },
    { number: 4, title: "Publish", icon: Eye, completed: false }
  ];

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Modern Step Progress */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6">
              <div className="flex items-center justify-center space-x-8">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                      currentStep === step.number 
                        ? 'bg-blue-600 shadow-lg shadow-blue-200' 
                        : currentStep > step.number
                          ? 'bg-green-500'
                          : 'bg-gray-100'
                    }`}>
                      <step.icon className={`w-5 h-5 ${
                        currentStep >= step.number ? 'text-white' : 'text-gray-400'
                      }`} />
                      {currentStep === step.number && (
                        <div className="absolute inset-0 rounded-full bg-blue-600 animate-pulse opacity-75"></div>
                      )}
                    </div>
                    <div className="ml-4 hidden sm:block">
                      <p className={`text-sm font-semibold ${
                        currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Step {step.number} of {steps.length}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-0.5 mx-6 transition-colors ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 1: Event Information */}
          {currentStep === 1 && (
            <div className="space-y-8">
              {/* Hero Section with Image Upload */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Let&apos;s Create Your Event</h2>
                  <p className="text-gray-600">Start with the basics - your event image and essential details</p>
                </div>

                {/* Image Upload Section */}
                <div className="max-w-2xl mx-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-4">Event Cover Image</label>
                  <div className="relative border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center hover:border-blue-300 transition-colors bg-white/50">
                    {imagePreview || (currentImageUrl && !removedCurrentImage) ? (
                      <div className="relative">
                        <Image
                          src={imagePreview || currentImageUrl || ""}
                          alt="Event preview"
                          width={800}
                          height={400}
                          className="w-full h-56 object-cover rounded-xl shadow-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeImage}
                          className="absolute top-4 right-4 shadow-lg hover:scale-105 transition-transform"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Upload className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload your event image</h3>
                        <p className="text-gray-500 mb-6">Choose a high-quality image that showcases your event</p>
                        <div className="flex justify-center items-center">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              id="event-image-upload"
                              name="eventImage"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                            <span className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors">
                              <Upload className="w-4 h-4 mr-2" />
                              Choose File
                            </span>
                          </label>
                        </div>
                        <p className="text-xs text-gray-400 mt-3">
                          PNG, JPG or GIF up to 5MB • Recommended: 1200×600px
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Event Details Form */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Event Details</h3>
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="mb-6">
                          <FormLabel className="text-base font-medium text-gray-900">Event Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="What&apos;s your event called?"
                              className="h-14 text-lg border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="mb-6">
                          <FormLabel className="text-base font-medium text-gray-900">Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Tell people what makes your event special..."
                              rows={4}
                              className="border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium text-gray-900 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              Location *
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Where will it happen?"
                                className="h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="event_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium text-gray-900 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              Date & Time *
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local"
                                {...field}
                                value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
                                className="h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-4 h-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={!form.watch("name") || !form.watch("description")}
                >
                  Continue to Tickets & Pricing
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Categories & Pricing */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Up Your Tickets</h2>
                  <p className="text-gray-600">Create different ticket categories with flexible pricing options</p>
                </div>

                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Ticket Categories</h3>
                        <p className="text-sm text-gray-500">e.g., VIP, General, Early Bird</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={addCategory}
                      className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-6 py-3 font-medium shadow-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {categoryFields.length === 0 && (
                      <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Ticket Categories Yet</h3>
                        <p className="text-gray-500 mb-6">
                          Create at least one ticket category to organize your event pricing.
                          <br />
                          <span className="text-sm">Each category can have multiple pricing tiers (Early Bird, Regular, etc.)</span>
                        </p>
                      </div>
                    )}

                    {categoryFields.map((category, categoryIndex) => {
                      const isCollapsed = collapsedCategories.has(category.id);
                      return (
                        <div key={category.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-lg text-sm font-semibold">
                                  {categoryIndex + 1}
                                </span>
                                <div>
                                  <p className="font-medium text-gray-900">Category {categoryIndex + 1}</p>
                                  <p className="text-xs text-gray-500">ID: {category.id}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleCategoryCollapse(category.id)}
                                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2"
                                >
                                  {isCollapsed ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronUp className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeCategory(categoryIndex)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {!isCollapsed && (
                            <div className="p-6 space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                  control={form.control}
                                  name={`categories.${categoryIndex}.name`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="font-medium text-gray-900">Category Name *</FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          placeholder="e.g., VIP Pass, General Admission"
                                          className="h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`categories.${categoryIndex}.total_tickets`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="font-medium text-gray-900 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-500" />
                                        Total Tickets Available *
                                      </FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          min="1"
                                          {...field}
                                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                          className="h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name={`categories.${categoryIndex}.description`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="font-medium text-gray-900">Description (Optional)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        placeholder="What&apos;s included in this category?"
                                        className="h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`categories.${categoryIndex}.is_active`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 bg-gray-50 rounded-xl p-4">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                      />
                                    </FormControl>
                                    <FormLabel className="font-medium text-gray-900 cursor-pointer">
                                      Make this category available for purchase
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />

                              <div className="border-t border-gray-200 pt-6">
                                <CategoryPricingTiers categoryIndex={categoryIndex} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)}
                  className="px-8 py-4 h-auto border-gray-300 rounded-xl font-semibold"
                >
                  Back to Event Info
                </Button>
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCurrentStep(4)}
                    disabled={categoryFields.length === 0}
                    className="px-8 py-4 h-auto border-gray-300 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Skip Products
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setCurrentStep(3)}
                    disabled={categoryFields.length === 0}
                    className="px-8 py-4 h-auto bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    Add Products
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Products */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Products (Optional)</h2>
                  <p className="text-gray-600">Enhance your event with additional products like merchandise, services, or essentials</p>
                </div>

                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Event Products</h3>
                        <p className="text-sm text-gray-500">e.g., Merchandise, Tickets</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={addProduct}
                      className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-6 py-3 font-medium shadow-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {products.map((product, productIndex) => {
                      const isCollapsed = collapsedCategories.has(product.id);
                      return (
                        <div key={product.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-lg text-sm font-semibold">
                                  {productIndex + 1}
                                </span>
                                <div>
                                  <p className="font-medium text-gray-900">Product {productIndex + 1}</p>
                                  <p className="text-xs text-gray-500">ID: {product.id}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleCategoryCollapse(product.id)}
                                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2"
                                >
                                  {isCollapsed ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronUp className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeProduct(productIndex)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {!isCollapsed && (
                            <div className="p-6 space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-900 mb-2">Product Name *</label>
                                  <Input 
                                    value={product.name}
                                    onChange={(e) => updateProduct(productIndex, { name: e.target.value })}
                                    placeholder="e.g., Event T-Shirt, VIP Package"
                                    className="h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-900 mb-2">Category</label>
                                  <Input 
                                    value={product.category}
                                    onChange={(e) => updateProduct(productIndex, { category: e.target.value })}
                                    placeholder="e.g., Apparel, Accessories"
                                    className="h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                                <Input 
                                  value={product.description}
                                  onChange={(e) => updateProduct(productIndex, { description: e.target.value })}
                                  placeholder="What&apos;s included in this product?"
                                  className="h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-900 mb-2">Base Price (RM) *</label>
                                  <div className="relative">
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">RM</span>
                                    <Input 
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={product.base_price}
                                      onChange={(e) => updateProduct(productIndex, { base_price: parseFloat(e.target.value) || 0 })}
                                      className="h-12 pl-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-900 mb-2">Product Type</label>
                                  <div className="h-12 bg-gray-50 border border-gray-200 rounded-xl flex items-center px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Shirt className="w-4 h-4 text-blue-600" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900">Event Essential</p>
                                        <p className="text-xs text-gray-500">Required for event access</p>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">Products added from event creation are always event essentials</p>
                                </div>
                              </div>

                              {product.product_type === "event-essential" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Default Quantity per Ticket</label>
                                    <Input 
                                      type="number"
                                      min="0"
                                      value={product.default_quantity || 1}
                                      onChange={(e) => updateProduct(productIndex, { default_quantity: parseInt(e.target.value) || 1 })}
                                      className="h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="1"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Max Quantity per Ticket</label>
                                    <Input 
                                      type="number"
                                      min="1"
                                      value={product.max_quantity_per_ticket || 5}
                                      onChange={(e) => updateProduct(productIndex, { max_quantity_per_ticket: parseInt(e.target.value) || 5 })}
                                      className="h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="5"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="border-t border-gray-200 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <Settings className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900">Product Variants</h4>
                                      <p className="text-sm text-gray-500">Size, color, or other options</p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={() => addVariant(productIndex)}
                                    className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl px-4 py-2 font-medium"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Variant
                                  </Button>
                                </div>

                                <div className="space-y-4">
                                  {product.variants.map((variant, variantIndex) => (
                                    <div key={variant.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                      <div className="flex items-center justify-between mb-4">
                                        <span className="font-medium text-gray-900">Variant {variantIndex + 1}</span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeVariant(productIndex, variantIndex)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name</label>
                                          <Input 
                                            value={variant.name}
                                            onChange={(e) => {
                                              const updatedVariants = [...product.variants];
                                              updatedVariants[variantIndex] = { ...variant, name: e.target.value };
                                              updateProduct(productIndex, { variants: updatedVariants });
                                            }}
                                            placeholder="e.g., Size, Color"
                                            className="h-10 border-gray-200 rounded-lg"
                                          />
                                        </div>

                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            checked={variant.is_required}
                                            onCheckedChange={(checked) => {
                                              const updatedVariants = [...product.variants];
                                              updatedVariants[variantIndex] = { ...variant, is_required: !!checked };
                                              updateProduct(productIndex, { variants: updatedVariants });
                                            }}
                                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                          />
                                          <label className="text-sm font-medium text-gray-700">Required</label>
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <label className="text-sm font-medium text-gray-700">Options</label>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => addVariantOption(productIndex, variantIndex)}
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                          >
                                            <Plus className="w-3 h-3 mr-1" />
                                            Add Option
                                          </Button>
                                        </div>

                                        {variant.options.map((option, optionIndex) => (
                                          <div key={option.id} className="grid grid-cols-4 gap-2 items-center">
                                            <Input 
                                              value={option.label}
                                              onChange={(e) => {
                                                const updatedVariants = [...product.variants];
                                                updatedVariants[variantIndex].options[optionIndex] = { 
                                                  ...option, 
                                                  label: e.target.value 
                                                };
                                                updateProduct(productIndex, { variants: updatedVariants });
                                              }}
                                              placeholder="Option name"
                                              className="h-8 text-sm border-gray-200 rounded-lg"
                                            />
                                            <Input 
                                              type="number"
                                              step="0.01"
                                              value={option.price_modifier || 0}
                                              onChange={(e) => {
                                                const updatedVariants = [...product.variants];
                                                updatedVariants[variantIndex].options[optionIndex] = { 
                                                  ...option, 
                                                  price_modifier: parseFloat(e.target.value) || 0 
                                                };
                                                updateProduct(productIndex, { variants: updatedVariants });
                                              }}
                                              placeholder="Price +/-"
                                              className="h-8 text-sm border-gray-200 rounded-lg"
                                            />
                                            <Input 
                                              type="number"
                                              min="0"
                                              value={option.quantity}
                                              onChange={(e) => {
                                                const updatedVariants = [...product.variants];
                                                const newQuantity = parseInt(e.target.value) || 0;
                                                updatedVariants[variantIndex].options[optionIndex] = { 
                                                  ...option, 
                                                  quantity: newQuantity,
                                                  available_quantity: newQuantity
                                                };
                                                updateProduct(productIndex, { variants: updatedVariants });
                                              }}
                                              placeholder="Qty"
                                              className="h-8 text-sm border-gray-200 rounded-lg"
                                            />
                                            {variant.options.length > 1 && (
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeVariantOption(productIndex, variantIndex, optionIndex)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg h-8 w-8 p-0"
                                              >
                                                <X className="w-3 h-3" />
                                              </Button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {products.length === 0 && (
                      <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Added Yet</h3>
                        <p className="text-gray-500 mb-6">
                          Products are optional! You can add merchandise, services, or event essentials to enhance your attendees&apos; experience.
                          <br />
                          <span className="text-sm">You can always add products later from your event dashboard.</span>
                        </p>

                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-4 h-auto border-gray-300 rounded-xl font-semibold"
                >
                  Back to Tickets & Pricing
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setCurrentStep(4)}
                  className="px-8 py-4 h-auto bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Review & Publish
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Publish */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Almost Ready!</h2>
                  <p className="text-gray-600">Review your event details and make it live</p>
                </div>

                <div className="max-w-3xl mx-auto space-y-8">
                  {/* Event Summary */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      Event Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Event Name</span>
                          <p className="text-gray-900 font-medium">{form.watch("name") || "Not set"}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Location</span>
                          <p className="text-gray-900">{form.watch("location") || "Not set"}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Date & Time</span>
                          <p className="text-gray-900">
                            {form.watch("event_date") 
                              ? new Date(form.watch("event_date")).toLocaleDateString("en-MY", {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : "Not set"
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Categories</span>
                          <p className="text-gray-900">
                            {categoryFields.length === 0 
                              ? "No categories added" 
                              : `${categoryFields.length} category(s) configured`
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Products</span>
                          <p className="text-gray-900">
                            {products.length === 0 
                              ? "No products added" 
                              : `${products.length} product(s) added`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validation Warning */}
                  {categoryFields.length === 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <h4 className="font-semibold text-red-900">Categories Required</h4>
                      </div>
                      <p className="text-red-700">
                        You need to add at least one ticket category before you can publish your event. 
                        Go back to Step 2 to add categories.
                      </p>
                    </div>
                  )}

                  {/* Publishing Options */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <FormField
                      control={form.control}
                      name="is_published"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-start space-x-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                            </FormControl>
                            <div className="flex-1">
                              <FormLabel className="text-lg font-semibold text-gray-900 cursor-pointer">
                                Publish event immediately
                              </FormLabel>
                              <p className="text-gray-600 mt-1">
                                Make your event visible to the public and start accepting ticket purchases right away. You can always unpublish later if needed.
                              </p>
                              {field.value && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-sm text-blue-800 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Your event will be live immediately after creation
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-4 h-auto border-gray-300 rounded-xl font-semibold"
                >
                  Back to Products
                </Button>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                    className="px-8 py-4 h-auto border-gray-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || categoryFields.length === 0}
                    className="px-8 py-4 h-auto bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {mode === "create" ? "Creating Event..." : "Updating Event..."}
                      </>
                    ) : categoryFields.length === 0 ? (
                      <>
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Add Categories First
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        {mode === "create" ? "Create Event" : "Update Event"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
