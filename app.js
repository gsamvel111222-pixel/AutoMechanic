const $ = (id) => document.getElementById(id);
const clean = (s) => (s || "").trim();
const currentVehicle = () => ({
  make: clean($("make").value),
  model: clean($("model").value),
  year: clean($("year").value),
  trim: clean($("trim").value),
  vin: clean($("vin").value).toUpperCase()
});
function notice(message, isError=false) {
  const el=$("vehicleNotice"); el.textContent=message; el.classList.remove("hidden");
  el.style.borderColor=isError?"#8e4b48":"#344252";
}
$("vehicleForm").addEventListener("submit", e => {
  e.preventDefault();
  const v=currentVehicle();
  if(!v.make){notice("Укажи марку автомобиля.",true);return;}
  notice("Автомобиль сохранён для поиска. Для точной применимости проверь VIN, двигатель, рынок и комплектацию. Данные в полях не подтверждают конкретную процедуру ремонта.");
});
$("decodeVin").addEventListener("click", async () => {
  const vin=clean($("vin").value).toUpperCase();
  if(!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)){notice("Введи полный VIN из 17 символов. Буквы I, O и Q в стандартном VIN не используются.",true);return;}
  notice("Запрашиваю открытые данные NHTSA vPIC…");
  try {
    const url=`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`;
    const response=await fetch(url);
    if(!response.ok) throw new Error("HTTP "+response.status);
    const payload=await response.json();
    const d=(payload.Results||[])[0]||{};
    const make=d.Make||"", model=d.Model||"", year=d.ModelYear||"", body=d.BodyClass||"", engine=[d.DisplacementL?`${d.DisplacementL} L`:"",d.EngineCylinders?`${d.EngineCylinders} cyl`:"",d.FuelTypePrimary||""].filter(Boolean).join(", ");
    if(make)$("make").value=make;
    if(model)$("model").value=model;
    if(year)$("year").value=year;
    if(engine)$("trim").value=engine;
    notice(`Ответ NHTSA vPIC получен.\nМарка: ${make||"нет данных"}\nМодель: ${model||"нет данных"}\nГод: ${year||"нет данных"}\nКузов: ${body||"нет данных"}\nДвигатель: ${engine||"нет данных"}\n\nЭто идентификационные данные, не подтверждение точной комплектации и не ремонтная инструкция. vPIC может иметь ограниченные сведения о машинах, не предназначенных для рынка США.`);
  } catch(err) {
    notice("Не удалось получить ответ от NHTSA vPIC. Проверь интернет-соединение или попробуй позже. Причина: "+err.message,true);
  }
});
document.querySelectorAll("[data-part]").forEach(btn=>btn.addEventListener("click",()=>{$("part").value=btn.dataset.part;}));
$("searchGuides").addEventListener("click",()=>{
  const v=currentVehicle(), part=clean($("part").value);
  if(!v.make){notice("Сначала укажи марку автомобиля.",true);$("make").focus();return;}
  if(!part){notice("Укажи название детали, которую нужно найти.",true);$("part").focus();return;}
  const query=[v.year,v.make,v.model,v.trim,part,"repair manual removal installation"].filter(Boolean).join(" ");
  const imgQuery=[v.year,v.make,v.model,part,"service manual diagram exploded view"].filter(Boolean).join(" ");
  $("searchWeb").href="https://www.google.com/search?q="+encodeURIComponent(query);
  $("searchImages").href="https://www.google.com/search?tbm=isch&q="+encodeURIComponent(imgQuery);
  $("resultSummary").textContent=`Поиск: ${[v.year,v.make,v.model,v.trim,part].filter(Boolean).join(" · ")}. Поисковые ссылки ведут во внешние источники; проверь точное совпадение поколения, двигателя и рынка.`;
  $("results").classList.remove("hidden");
  $("results").scrollIntoView({behavior:"smooth",block:"start"});
});
$("manualFile").addEventListener("change",()=>{
  const file=$("manualFile").files[0]; if(!file)return;
  if(file.size>50*1024*1024){$("fileInfo").textContent="Файл больше 50 МБ. Выбери меньший файл."; $("fileInfo").classList.remove("hidden"); return;}
  $("fileInfo").textContent=`Выбран файл: ${file.name} (${(file.size/1024/1024).toFixed(2)} МБ). Файл остаётся в текущем браузере; приложение не индексирует и не передаёт его.`;
  $("fileInfo").classList.remove("hidden");
});
let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").classList.remove("hidden");});
$("installBtn").addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installBtn").classList.add("hidden");});
