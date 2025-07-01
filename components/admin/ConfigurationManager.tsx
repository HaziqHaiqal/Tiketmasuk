"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAllConfigs, useEditableConfigs } from "@/lib/configUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "@/hooks/use-toast";

interface ConfigFormData {
  config_key: string;
  category: string;
  name: string;
  description: string;
  config_data: string; // JSON string
  is_system_config: boolean;
  editable_by_admin: boolean;
  editable_by_organizer: boolean;
}

export default function ConfigurationManager() {
  const allConfigs = useAllConfigs();
  const editableConfigs = useEditableConfigs();
  const userRoles = useQuery(api.users.getUserRoles, {});
  
  const createConfig = useMutation(api.systemConfigs.createConfig);
  const updateConfig = useMutation(api.systemConfigs.updateConfig);
  const deleteConfig = useMutation(api.systemConfigs.deleteConfig);
  const toggleConfigActive = useMutation(api.systemConfigs.toggleConfigActive);
  
  // Check user permissions
  const isAdmin = userRoles?.some((role: any) => role.role === "admin") || false;
  const isOrganizer = userRoles?.some((role: any) => role.role === "organizer") || false;
  
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  
  const [formData, setFormData] = useState<ConfigFormData>({
    config_key: "",
    category: "",
    name: "",
    description: "",
    config_data: "",
    is_system_config: false,
    editable_by_admin: true,
    editable_by_organizer: false,
  });

  const categories = [
    "location", "event", "user", "system", "venue"
  ];

  const handleCreateConfig = async () => {
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(formData.config_data);
      } catch (e) {
        toast({
          title: "Error",
          description: "Invalid JSON format in configuration data",
          variant: "destructive",
        });
        return;
      }

      await createConfig({
        config_key: formData.config_key,
        category: formData.category,
        name: formData.name,
        description: formData.description,
        config_data: parsedData,
        is_system_config: formData.is_system_config,
        editable_by_admin: formData.editable_by_admin,
        editable_by_organizer: formData.editable_by_organizer,
      });

      toast({
        title: "Success",
        description: "Configuration created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create configuration",
        variant: "destructive",
      });
    }
  };

  const handleUpdateConfig = async () => {
    if (!editingConfig) return;

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(formData.config_data);
      } catch (e) {
        toast({
          title: "Error",
          description: "Invalid JSON format in configuration data",
          variant: "destructive",
        });
        return;
      }

      await updateConfig({
        config_id: editingConfig._id,
        name: formData.name,
        description: formData.description,
        config_data: parsedData,
      });

      toast({
        title: "Success",
        description: "Configuration updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingConfig(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update configuration",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfig = async (configId: Id<"system_configs">) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;

    try {
      await deleteConfig({ config_id: configId });
      toast({
        title: "Success",
        description: "Configuration deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete configuration",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (configId: Id<"system_configs">) => {
    try {
      await toggleConfigActive({ config_id: configId });
      toast({
        title: "Success",
        description: "Configuration status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update configuration status",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (config: any) => {
    setEditingConfig(config);
    setFormData({
      config_key: config.config_key,
      category: config.category,
      name: config.name,
      description: config.description || "",
      config_data: JSON.stringify(config.config_data, null, 2),
      is_system_config: config.is_system_config,
      editable_by_admin: config.editable_by_admin,
      editable_by_organizer: config.editable_by_organizer,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      config_key: "",
      category: "",
      name: "",
      description: "",
      config_data: "",
      is_system_config: false,
      editable_by_admin: true,
      editable_by_organizer: false,
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!allConfigs) {
    return <div>Loading configurations...</div>;
  }

  const groupedConfigs = allConfigs.reduce((acc: Record<string, any[]>, config: any) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configuration Manager</h2>
          <p className="text-muted-foreground">
            Manage system configurations and settings
          </p>
        </div>
        
        {(isAdmin || isOrganizer) && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Configuration</Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Configuration</DialogTitle>
              <DialogDescription>
                Add a new system configuration
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="config_key">Configuration Key</Label>
                  <Input
                    id="config_key"
                    value={formData.config_key}
                    onChange={(e) => setFormData({ ...formData, config_key: e.target.value })}
                    placeholder="e.g., custom_categories"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Display name for the configuration"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of what this configuration controls"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="config_data">Configuration Data (JSON)</Label>
                <Textarea
                  id="config_data"
                  value={formData.config_data}
                  onChange={(e) => setFormData({ ...formData, config_data: e.target.value })}
                  placeholder='{"key": "value"}'
                  className="font-mono text-sm"
                  rows={6}
                />
              </div>
              
              <div className="space-y-4">
                {/* Only admins can create system configurations */}
                {isAdmin && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_system_config"
                      checked={formData.is_system_config}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_system_config: checked })}
                    />
                    <Label htmlFor="is_system_config">System Configuration</Label>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editable_by_admin"
                    checked={formData.editable_by_admin}
                    onCheckedChange={(checked) => setFormData({ ...formData, editable_by_admin: checked })}
                  />
                  <Label htmlFor="editable_by_admin">Editable by Admin</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editable_by_organizer"
                    checked={formData.editable_by_organizer}
                    onCheckedChange={(checked) => setFormData({ ...formData, editable_by_organizer: checked })}
                  />
                  <Label htmlFor="editable_by_organizer">Editable by Organizer</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateConfig}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Configurations</TabsTrigger>
          <TabsTrigger value="editable">Editable</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {Object.entries(groupedConfigs).map(([category, configs]) => {
            const configArray = configs as any[];
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">{category} Configurations</CardTitle>
                  <CardDescription>
                    {configArray.length} configuration{configArray.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {configArray.map((config: any) => (
                    <div key={config._id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{config.name}</h4>
                            <Badge variant={config.is_active ? "default" : "secondary"}>
                              {config.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {config.is_system_config && (
                              <Badge variant="outline">System</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Key: <code className="bg-muted px-1 rounded">{config.config_key}</code>
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          {/* Show edit button if user has permission to edit this config */}
                          {((isAdmin && config.editable_by_admin) || (isOrganizer && config.editable_by_organizer)) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(config)}
                            >
                              Edit
                            </Button>
                          )}
                          
                          {/* Show toggle button if user has permission to edit this config */}
                          {((isAdmin && config.editable_by_admin) || (isOrganizer && config.editable_by_organizer)) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(config._id)}
                            >
                              {config.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          )}
                          
                          {/* Show delete button only for non-system configs that user can edit */}
                          {!config.is_system_config && 
                           ((isAdmin && config.editable_by_admin) || (isOrganizer && config.editable_by_organizer && !config.is_system_config)) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteConfig(config._id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Version: {config.version}</p>
                        <p>Created: {formatDate(config.created_at)}</p>
                        {config.updated_at && (
                          <p>Updated: {formatDate(config.updated_at)}</p>
                        )}
                      </div>
                      
                      <details className="text-sm">
                        <summary className="cursor-pointer font-medium">Configuration Data</summary>
                        <pre className="mt-2 bg-muted p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(config.config_data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="editable" className="space-y-4">
          {editableConfigs && editableConfigs.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Editable Configurations</CardTitle>
                <CardDescription>
                  Configurations you can modify based on your role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {editableConfigs.map((config: any) => (
                  <div key={config._id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{config.name}</h4>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(config)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertDescription>
                No editable configurations available for your role.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          {allConfigs.filter((config: any) => config.is_system_config).map((config: any) => (
            <Card key={config._id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {config.name}
                  <Badge variant="outline">System</Badge>
                </CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    This is a system configuration and should be modified with caution.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Configuration</DialogTitle>
            <DialogDescription>
              Modify the configuration settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_config_data">Configuration Data (JSON)</Label>
              <Textarea
                id="edit_config_data"
                value={formData.config_data}
                onChange={(e) => setFormData({ ...formData, config_data: e.target.value })}
                className="font-mono text-sm"
                rows={8}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateConfig}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 