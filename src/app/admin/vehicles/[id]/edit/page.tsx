import { notFound } from 'next/navigation'
import VehicleForm from '@/components/vehicles/VehicleForm'
import { getVehicle, updateVehicle } from '@/lib/actions/vehicles'

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const vehicle = await getVehicle(id).catch(() => null)
  if (!vehicle) notFound()

  const action = updateVehicle.bind(null, id)

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{vehicle.name} 수정</h1>
      <VehicleForm defaultValues={vehicle} action={action} submitLabel="수정 저장" />
    </div>
  )
}
