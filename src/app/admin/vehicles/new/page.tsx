import VehicleForm from '@/components/vehicles/VehicleForm'
import { createVehicle } from '@/lib/actions/vehicles'

export default function NewVehiclePage() {
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">차량 등록</h1>
      <VehicleForm action={createVehicle} submitLabel="등록" />
    </div>
  )
}
