export class ImageUploadService {
  private static readonly API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  /**
   * Obtener token de autenticación
   */
  private static async getAuthToken(): Promise<string> {
    // Asumiendo que usas Clerk para autenticación
    const token = await (window as any).Clerk?.session?.getToken();
    if (!token) {
      throw new Error("No authentication token available");
    }
    return token;
  }

  /**
   * Subir imagen usando el backend API
   */
  static async uploadImage(
    file: File,
    type: "banner" | "logo" | "item",
    oldImageUrl?: string,
  ): Promise<string> {
    try {
      // Verificar que el archivo sea una imagen
      if (!file.type.startsWith("image/")) {
        throw new Error("El archivo debe ser una imagen");
      }

      // Verificar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("La imagen no puede ser mayor a 5MB");
      }

      console.log("📤 Uploading image:", file.name);

      // Preparar FormData
      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", type);
      if (oldImageUrl) {
        formData.append("oldImageUrl", oldImageUrl);
      }

      // Obtener token de autenticación
      const token = await this.getAuthToken();

      // Hacer petición al backend
      const response = await fetch(`${this.API_BASE_URL}/api/images/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();
      console.log("✅ Image uploaded successfully:", data.imageUrl);
      return data.imageUrl;
    } catch (error) {
      console.error("❌ Error in uploadImage:", error);
      throw error;
    }
  }

  /**
   * Eliminar imagen usando el backend API
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      console.log("🗑️ Deleting image:", imageUrl);

      // Obtener token de autenticación
      const token = await this.getAuthToken();

      // Hacer petición al backend
      const response = await fetch(`${this.API_BASE_URL}/api/images/delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete image");
      }

      console.log("✅ Image deleted successfully");
    } catch (error) {
      console.error("❌ Error in deleteImage:", error);
      throw error;
    }
  }

  /**
   * Actualizar imagen (elimina la anterior y sube la nueva)
   */
  static async updateImage(
    file: File,
    type: "banner" | "logo" | "item",
    oldImageUrl?: string,
  ): Promise<string> {
    return await this.uploadImage(file, type, oldImageUrl);
  }

  /**
   * Convertir File a Base64 (para preview local)
   */
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Redimensionar imagen manteniendo alta calidad
   */
  static async resizeImage(
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1280,
    quality: number = 0.92,
  ): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Configurar canvas con alta resolución
        canvas.width = width;
        canvas.height = height;

        // Optimizaciones para mejor calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Redimensionar con mejor algoritmo
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality,
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
}
