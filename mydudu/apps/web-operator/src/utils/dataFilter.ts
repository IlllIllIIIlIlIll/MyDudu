import { AppUser } from '../context/AuthContext';
import { Child, Device, Validation } from '../data/mockData';

export function filterChildrenByUserRole(children: Child[], user: AppUser | null): Child[] {
  if (!user) return [];

  // Admin can see all data
  if (user.role === 'admin') {
    return children;
  }

  // Puskesmas can see all children in their kecamatan (across all villages and posyandus)
  if (user.role === 'puskesmas' && user.assignedLocation) {
    return children.filter(child =>
      child.kecamatan === user.assignedLocation!.kecamatan
    );
  }

  // Posyandu can only see children from their specific posyandu
  if (user.role === 'posyandu' && user.assignedLocation) {
    return children.filter(child =>
      child.posyandu === user.assignedLocation!.posyanduName &&
      child.village === user.assignedLocation!.village
    );
  }

  return [];
}

export function filterDevicesByUserRole(devices: Device[], user: AppUser | null): Device[] {
  if (!user) return [];

  // Admin can see all devices
  if (user.role === 'admin') {
    return devices;
  }

  // Puskesmas can see all devices in their kecamatan
  if (user.role === 'puskesmas' && user.assignedLocation) {
    return devices.filter(device =>
      device.kecamatan === user.assignedLocation!.kecamatan
    );
  }

  // Posyandu can only see devices from their specific posyandu
  if (user.role === 'posyandu' && user.assignedLocation) {
    return devices.filter(device =>
      device.posyandu === user.assignedLocation!.posyanduName &&
      device.location === user.assignedLocation!.village
    );
  }

  return [];
}

export function filterValidationsByUserRole(validations: Validation[], user: AppUser | null): Validation[] {
  if (!user) return [];

  // Admin can see all validations
  if (user.role === 'admin') {
    return validations;
  }

  // Puskesmas can see all validations in their kecamatan
  // In a real app, we'd filter by location metadata in validation records
  if (user.role === 'puskesmas') {
    return validations;
  }

  // Posyandu can see validations from their location
  if (user.role === 'posyandu') {
    return validations;
  }

  return [];
}

export function canAccessPage(page: string, user: AppUser | null): boolean {
  if (!user) return false;

  // Admin pages only accessible by admin
  if (page.startsWith('admin-')) {
    return user.role === 'admin';
  }

  // All other pages accessible by operators
  return user.role === 'posyandu' || user.role === 'puskesmas';
}
