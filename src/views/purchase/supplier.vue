<template>
  <div>
    <PageHeader title="供应商管理" sub="供应商基础资料 · 供应商货品 · 合作状态">
      <el-button size="small" @click="router.push('/purchase')">返回采购管理</el-button>
    </PageHeader>

    <div class="card" style="padding: 14px">
      <SupplierPanel />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import SupplierPanel from '@/components/purchase/SupplierPanel.vue'

const router = useRouter()
</script>
