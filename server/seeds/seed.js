const bcrypt = require('bcryptjs')
const { getDB, saveDB } = require('../db')

function seed() {
  const db = getDB()

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin')
  if (existing) {
    console.log('[seed] 已有数据，跳过')
    return
  }

  const hash = bcrypt.hashSync('admin123', 10)
  db.prepare('INSERT INTO users (username, password_hash, display_name, email, role) VALUES (?, ?, ?, ?, ?)')
    .run('admin', hash, 'Administrator', 'admin@example.com', 'admin')
  db.prepare('INSERT INTO users (username, password_hash, display_name, email, role) VALUES (?, ?, ?, ?, ?)')
    .run('editor', hash, 'Editor User', 'editor@example.com', 'editor')
  db.prepare('INSERT INTO users (username, password_hash, display_name, email, role) VALUES (?, ?, ?, ?, ?)')
    .run('viewer', hash, 'Viewer User', 'viewer@example.com', 'viewer')

  const pets = [
    { name: '糯米', species: 'cat', breed: '英短蓝猫', age_group: 'young', gender: 'female', size_group: 'small', location_city: '北京',
      description: '一岁的英短蓝猫，性格温顺粘人，已绝育已打疫苗。喜欢晒太阳和追逐激光笔。',
      image_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop' },
    { name: '坦克', species: 'dog', breed: '金毛寻回犬', age_group: 'adult', gender: 'male', size_group: 'large', location_city: '上海',
      description: '三岁金毛，性格活泼开朗，对人友善。已绝育已打疫苗。适合有院子的家庭。',
      image_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop' },
    { name: '布丁', species: 'cat', breed: '橘猫', age_group: 'baby', gender: 'male', size_group: 'small', location_city: '广州',
      description: '三个月大的小橘猫，精力充沛特别能吃。已驱虫，需要新主人耐心照顾。',
      image_url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop' },
    { name: '豆豆', species: 'dog', breed: '柯基', age_group: 'young', gender: 'female', size_group: 'medium', location_city: '深圳',
      description: '一岁半柯基，短腿大屁股，性格活泼可爱。已绝育已打疫苗。会基本指令。',
      image_url: 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=400&h=400&fit=crop' },
    { name: '翠花', species: 'bird', breed: '虎皮鹦鹉', age_group: 'young', gender: 'female', size_group: 'small', location_city: '杭州',
      description: '半岁虎皮鹦鹉，蓝色羽毛，性格活泼，已会学简单人语。带笼子一起送养。',
      image_url: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&h=400&fit=crop' },
    { name: '雪球', species: 'other', breed: '侏儒兔', age_group: 'young', gender: 'male', size_group: 'small', location_city: '成都',
      description: '八个月侏儒兔，纯白毛色，性格温和。已绝育，会使用兔厕所。适合室内饲养。',
      image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=400&fit=crop' },
  ]

  const insertPet = db.prepare(
    'INSERT INTO pets (name, species, breed, age_group, gender, size_group, description, location_city, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  for (const p of pets) {
    insertPet.run(p.name, p.species, p.breed, p.age_group, p.gender, p.size_group, p.description, p.location_city, p.image_url)
  }

  saveDB()
  console.log('[seed] 初始化完成: 3 用户 + 6 宠物')
}

module.exports = { seed }
