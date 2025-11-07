<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold">Relatórios e Balanços</h2>

    <!-- Período -->
    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="label">Período</label>
          <select v-model="periodo" @change="carregarRelatorio" class="input">
            <option value="semanal">Semanal</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </select>
        </div>
        <div>
          <label class="label">Data Início</label>
          <input v-model="dataInicio" type="date" class="input" />
        </div>
        <div>
          <label class="label">Data Fim</label>
          <input v-model="dataFim" type="date" class="input" />
        </div>
      </div>
      <div class="mt-4 flex space-x-3">
        <button @click="carregarRelatorio" class="btn btn-primary">📊 Gerar Relatório</button>
        <button @click="exportarPDF" class="btn btn-secondary">📄 Exportar PDF</button>
        <button @click="exportarExcel" class="btn btn-secondary">📊 Exportar Excel</button>
      </div>
    </div>

    <!-- Resumo -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card">
        <p class="text-gray-500">Total de Coletas</p>
        <p class="text-3xl font-bold mt-2">{{ totalColetas }}</p>
      </div>
      <div class="card">
        <p class="text-gray-500">Peso Total (kg)</p>
        <p class="text-3xl font-bold mt-2">{{ pesoTotal.toFixed(2) }}</p>
      </div>
      <div class="card">
        <p class="text-gray-500">Valor Total</p>
        <p class="text-3xl font-bold mt-2 text-green-600">{{ formatCurrency(valorTotal) }}</p>
      </div>
    </div>

    <!-- Detalhamento -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-4">Detalhamento por Material</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left py-3 px-4">Material</th>
              <th class="text-right py-3 px-4">Quantidade (kg)</th>
              <th class="text-right py-3 px-4">Valor Total</th>
              <th class="text-right py-3 px-4">Coletas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(data, material) in detalhamento" :key="material" class="border-b">
              <td class="py-3 px-4">{{ material }}</td>
              <td class="py-3 px-4 text-right">{{ data.peso.toFixed(2) }}</td>
              <td class="py-3 px-4 text-right">{{ formatCurrency(data.valor) }}</td>
              <td class="py-3 px-4 text-right">{{ data.quantidade }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useColetasStore } from '@/stores/coletas'
import { format, subDays, subMonths } from 'date-fns'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

const coletasStore = useColetasStore()
const periodo = ref('semanal')
const dataInicio = ref(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
const dataFim = ref(format(new Date(), 'yyyy-MM-dd'))
const coletas = ref([])

const totalColetas = computed(() => coletas.value.length)
const pesoTotal = computed(() => {
  return coletas.value.reduce((sum, c) => {
    return sum + c.materiais.reduce((s, m) => s + m.pesoLiquido, 0)
  }, 0)
})
const valorTotal = computed(() => {
  return coletas.value.reduce((sum, c) => sum + c.valorTotalColeta, 0)
})

const detalhamento = computed(() => {
  const det = {}
  coletas.value.forEach(c => {
    c.materiais.forEach(m => {
      if (!det[m.nomeMaterial]) {
        det[m.nomeMaterial] = { peso: 0, valor: 0, quantidade: 0 }
      }
      det[m.nomeMaterial].peso += m.pesoLiquido
      det[m.nomeMaterial].valor += m.valorTotal
      det[m.nomeMaterial].quantidade++
    })
  })
  return det
})

const carregarRelatorio = async () => {
  const inicio = new Date(dataInicio.value)
  const fim = new Date(dataFim.value)
  coletas.value = await coletasStore.getColetasPorPeriodo(inicio, fim)
}

const exportarPDF = () => {
  const doc = new jsPDF()
  doc.text('Relatório Ferrotall Sucatas', 14, 15)
  doc.autoTable({
    head: [['Material', 'Peso (kg)', 'Valor', 'Coletas']],
    body: Object.entries(detalhamento.value).map(([mat, data]) => [
      mat, data.peso.toFixed(2), formatCurrency(data.valor), data.quantidade
    ])
  })
  doc.save('relatorio.pdf')
}

const exportarExcel = () => {
  const ws = XLSX.utils.json_to_sheet(
    Object.entries(detalhamento.value).map(([mat, data]) => ({
      Material: mat,
      'Peso (kg)': data.peso.toFixed(2),
      Valor: data.valor,
      Coletas: data.quantidade
    }))
  )
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
  XLSX.writeFile(wb, 'relatorio.xlsx')
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

onMounted(() => carregarRelatorio())
</script>
