"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";

interface ImageUploadProps {
  label: string;
  description?: string;
  currentImageUrl?: string;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  aspectRatio?: "square" | "banner" | "logo";
  maxSize?: number; // in MB
  accept?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  label,
  description,
  currentImageUrl,
  onImageSelect,
  onImageRemove,
  aspectRatio = "square",
  maxSize = 5,
  accept = "image/*",
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case "banner":
        return "aspect-[3/1]"; // Wide banner
      case "logo":
        return "aspect-square"; // Square logo
      case "square":
      default:
        return "aspect-square"; // Square profile image
    }
  };

  const getRecommendedSize = () => {
    switch (aspectRatio) {
      case "banner":
        return "1200x400px";
      case "logo":
        return "400x400px";
      case "square":
      default:
        return "400x400px";
    }
  };

  const handleFileSelect = (file: File) => {
    setError("");

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    onImageSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUploadClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {currentImageUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onImageRemove}
            disabled={disabled}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      <Card
        className={`relative overflow-hidden transition-colors ${getAspectRatioClasses()} ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        {currentImageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={currentImageUrl}
              alt={label}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 hover:opacity-100 transition-opacity">
                <Upload className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {isDragging ? "Drop image here" : "Upload image"}
              </p>
              <p className="text-xs text-gray-500">
                Drag & drop or click to browse
              </p>
              <p className="text-xs text-gray-400">
                Recommended: {getRecommendedSize()} • Max {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </Card>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
} 