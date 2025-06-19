"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Address validation schema
const addressSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  company: z.string().optional(),
  address_line_1: z.string().min(1, "Address is required"),
  address_line_2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state_province: z.string().min(1, "State/Province is required"),
  postal_code: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  title: string;
  onAddressChange: (address: AddressFormData) => void;
  initialData?: Partial<AddressFormData>;
  showSameAsBilling?: boolean;
  sameAsBilling?: boolean;
  onSameAsBillingChange?: (same: boolean) => void;
  disabled?: boolean;
}

// Common countries (can be expanded)
const countries = [
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapore" },
  { code: "TH", name: "Thailand" },
  { code: "ID", name: "Indonesia" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
];

// Malaysian states
const malaysianStates = [
  "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Malacca", "Negeri Sembilan",
  "Pahang", "Penang", "Perak", "Perlis", "Putrajaya", "Sabah", "Sarawak", "Selangor", "Terengganu"
];

export function AddressForm({
  title,
  onAddressChange,
  initialData,
  showSameAsBilling = false,
  sameAsBilling = false,
  onSameAsBillingChange,
  disabled = false
}: AddressFormProps) {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      company: initialData?.company || "",
      address_line_1: initialData?.address_line_1 || "",
      address_line_2: initialData?.address_line_2 || "",
      city: initialData?.city || "",
      state_province: initialData?.state_province || "",
      postal_code: initialData?.postal_code || "",
      country: initialData?.country || "MY",
      phone: initialData?.phone || "",
    },
  });

  const selectedCountry = form.watch("country");

  // Call onAddressChange when form values change
  const handleFormChange = () => {
    const formData = form.getValues();
    onAddressChange(formData);
  };

  return (
    <Card className={disabled ? "opacity-50" : ""}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {showSameAsBilling && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="same-as-billing"
              checked={sameAsBilling}
              onCheckedChange={(checked) => onSameAsBillingChange?.(checked as boolean)}
              disabled={disabled}
            />
            <label
              htmlFor="same-as-billing"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Same as billing address
            </label>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={disabled}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFormChange();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={disabled}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFormChange();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Company */}
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={disabled}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFormChange();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address Lines */}
            <FormField
              control={form.control}
              name="address_line_1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1 *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Street address, P.O. box, company name, c/o"
                      disabled={disabled}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFormChange();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_line_2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Apartment, suite, unit, building, floor, etc."
                      disabled={disabled}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFormChange();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City, State, Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={disabled}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFormChange();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state_province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province *</FormLabel>
                    <FormControl>
                      {selectedCountry === "MY" ? (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleFormChange();
                          }}
                          disabled={disabled}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {malaysianStates.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          {...field}
                          disabled={disabled}
                          onChange={(e) => {
                            field.onChange(e);
                            handleFormChange();
                          }}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={disabled}
                        onChange={(e) => {
                          field.onChange(e);
                          handleFormChange();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Country */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleFormChange();
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+60 12-345 6789"
                      disabled={disabled}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFormChange();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 