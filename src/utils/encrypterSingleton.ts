import { serverPublicKey, defaultSignKey } from '@/constant/encrypt.constant'
import { createEncrypter } from "@/utils/encrypt"; 

export const encrypter = createEncrypter({
    serverPublicKeyBase64: serverPublicKey,
    defaultSignKeyBase64: defaultSignKey,
});