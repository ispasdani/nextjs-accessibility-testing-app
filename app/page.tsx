"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EyeIcon, UploadIcon, AlertTriangle, MinusIcon, PlusIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";

export default function Home() {
  const [previewImage, setPreviewImage] = useState("");
  const [originalImage, setOriginalImage] = useState("");
  const [activeFilter, setActiveFilter] = useState("normal");
  const [intensity, setIntensity] = useState(50);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filters = {
    normal: "None",
    blur: "Blurred Vision",
    contrast: "Reduced Contrast",
    protanopia: "Protanopia (No Red)",
    deuteranopia: "Deuteranopia (No Green)",
    tritanopia: "Tritanopia (No Blue)",
    achromatopsia: "Achromatopsia (No Color)",
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZooming || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!isZooming) return;
    
    e.preventDefault();
    
    const delta = -e.deltaY * 0.01;
    const newZoomLevel = Math.min(Math.max(zoomLevel + delta, 1.5), 5);
    setZoomLevel(newZoomLevel);
  };

  const handleZoomLevelChange = (value: number[]) => {
    setZoomLevel(value[0]);
  };

  const applyFilter = (filter: string, intensityValue: number = intensity) => {
    if (!originalImage) return;
    
    if (filter === "normal") {
      setPreviewImage(originalImage);
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const strength = intensityValue / 100;

      switch (filter) {
        case "blur":
          ctx.filter = `blur(${strength * 8}px)`;
          ctx.drawImage(img, 0, 0);
          break;

        case "contrast":
          for (let i = 0; i < data.length; i += 4) {
            const mix = strength;
            data[i] = data[i] * (1 - mix) + 128 * mix;
            data[i + 1] = data[i + 1] * (1 - mix) + 128 * mix;
            data[i + 2] = data[i + 2] * (1 - mix) + 128 * mix;
          }
          ctx.putImageData(imageData, 0, 0);
          break;

        case "protanopia":
          for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            data[i] = data[i] * (1 - strength) + gray * strength;
          }
          ctx.putImageData(imageData, 0, 0);
          break;

        case "deuteranopia":
          for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            data[i + 1] = data[i + 1] * (1 - strength) + gray * strength;
          }
          ctx.putImageData(imageData, 0, 0);
          break;

        case "tritanopia":
          for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            data[i + 2] = data[i + 2] * (1 - strength) + gray * strength;
          }
          ctx.putImageData(imageData, 0, 0);
          break;

        case "achromatopsia":
          for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            data[i] = data[i] * (1 - strength) + gray * strength;
            data[i + 1] = data[i + 1] * (1 - strength) + gray * strength;
            data[i + 2] = data[i + 2] * (1 - strength) + gray * strength;
          }
          ctx.putImageData(imageData, 0, 0);
          break;
      }

      setPreviewImage(canvas.toDataURL());
    };

    img.src = originalImage;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setOriginalImage(result);
        setPreviewImage(result);
        setActiveFilter("normal");
        setIntensity(50);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIntensityChange = (value: number[]) => {
    const newIntensity = value[0];
    setIntensity(newIntensity);
    applyFilter(activeFilter, newIntensity);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Vision Accessibility Tester</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload a screenshot or image to test how it appears to users with different vision conditions.
          </p>
        </div>

        <Card className="p-6">
          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={() => document.getElementById('fileInput')?.click()}
              className="w-full max-w-md"
            >
              <UploadIcon className="mr-2 h-4 w-4" />
              Upload Image
            </Button>
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground">
              Supported formats: PNG, JPEG, WebP
            </p>
          </div>
        </Card>

        {previewImage && (
          <Tabs value={activeFilter} className="space-y-4">
            <TabsList className="tabs-scroll flex overflow-x-auto whitespace-nowrap gap-5 h-[50px]">
  {Object.entries(filters).map(([key, label]) => (
    <TabsTrigger
      key={key}
      value={key}
      onClick={() => {
        setActiveFilter(key);
        applyFilter(key);
      }}
      className="flex-shrink-0" // prevents tab from shrinking below its content width
    >
      <EyeIcon className="mr-2 h-4 w-4" />
      {label}
    </TabsTrigger>
  ))}
</TabsList>


            <div className="grid gap-6">
              {activeFilter !== "normal" && (
                <div className="flex items-center gap-4 px-4">
                  <MinusIcon className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[intensity]}
                    onValueChange={handleIntensityChange}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <PlusIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between px-4">
                  <Button
                    variant={isZooming ? "secondary" : "outline"}
                    onClick={() => setIsZooming(!isZooming)}
                    className="flex items-center gap-2"
                  >
                    {isZooming ? <ZoomOutIcon className="h-4 w-4" /> : <ZoomInIcon className="h-4 w-4" />}
                    {isZooming ? "Disable Zoom" : "Enable Zoom"}
                  </Button>
                  
                  {isZooming && (
                    <div className="flex items-center gap-4 flex-1 max-w-xs ml-4">
                      <MinusIcon className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        value={[zoomLevel]}
                        onValueChange={handleZoomLevelChange}
                        min={1.5}
                        max={5}
                        step={0.5}
                        className="flex-1"
                      />
                      <PlusIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div 
                  ref={containerRef}
                  className="aspect-video relative rounded-lg overflow-hidden border bg-white"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setIsZooming(false)}
                  onWheel={handleWheel}
                >
                  <img
                    ref={imageRef}
                    src={previewImage}
                    alt="Image preview"
                    className="w-full h-full object-contain"
                  />
                  {isZooming && (
                    <div
                      className="absolute pointer-events-none rounded-full border-2 border-primary shadow-lg overflow-hidden"
                      style={{
                        width: "200px",
                        height: "200px",
                        left: `${mousePosition.x}%`,
                        top: `${mousePosition.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div
                        className="absolute"
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundImage: `url(${previewImage})`,
                          backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                          backgroundSize: `${zoomLevel * 100}%`,
                          backgroundRepeat: "no-repeat",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Accessibility Tips</AlertTitle>
                <AlertDescription>
                  • Ensure sufficient color contrast for text readability
                  <br />
                  • Provide alt text for all important images
                  <br />
                  • Use semantic HTML elements for better screen reader support
                  <br />
                  • Make all interactive elements keyboard accessible
                  <br />
                  • Test with different vision conditions using the filters above
                </AlertDescription>
              </Alert>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}