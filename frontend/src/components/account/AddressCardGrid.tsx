import { MapPin, Trash2, Edit2 } from 'lucide-react'

export interface AddressCardProps {
  id: number
  street: string
  number: string
  complement?: string | null
  neighborhood: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

interface AddressCardGridProps {
  addresses: AddressCardProps[]
  isLoading: boolean
  onEdit: (address: AddressCardProps) => void
  onDelete: (id: number) => void
  onAddNew: () => void
}

export function AddressCardGrid({
  addresses,
  isLoading,
  onEdit,
  onDelete,
  onAddNew
}: AddressCardGridProps) {
  if (isLoading) {
    return <div className="text-center py-8">Carregando endereços...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Meus Endereços</h3>
        <button
          onClick={onAddNew}
          className="px-4 py-2 bg-lilac-500 hover:bg-lilac-600 text-white rounded-lg text-sm transition-colors"
        >
          ＋ Novo Endereço
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-8 text-ink-400">
          <MapPin className="mx-auto mb-2 opacity-50" />
          <p>Nenhum endereço cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="p-4 border border-ink-200 rounded-lg hover:shadow-md transition-shadow"
            >
              {addr.isDefault && (
                <div className="mb-2 inline-block px-2 py-1 bg-lilac-100 text-lilac-700 text-xs font-semibold rounded">
                  Padrão
                </div>
              )}
              <p className="font-semibold text-ink-800">
                {addr.street}, {addr.number}
              </p>
              {addr.complement && <p className="text-sm text-ink-600">{addr.complement}</p>}
              <p className="text-sm text-ink-600">
                {addr.neighborhood}, {addr.city} - {addr.state}
              </p>
              <p className="text-sm text-ink-500">{addr.zipCode}</p>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => onEdit(addr)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded text-sm transition-colors"
                >
                  <Edit2 size={14} />
                  Editar
                </button>
                <button
                  onClick={() => onDelete(addr.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm transition-colors"
                >
                  <Trash2 size={14} />
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
