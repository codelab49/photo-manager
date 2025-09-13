import { Metadata } from 'next';
import { GalleryManagement } from './GalleryManagement';

export const metadata: Metadata = {
  title: 'Gallery Management - Photo Manager',
  description: 'Create and manage client galleries',
};

export default function GalleriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gallery Management</h1>
        <p className="text-gray-600">Create and manage galleries to share with clients</p>
      </div>
      
      <GalleryManagement />
    </div>
  );
}
